true /*; NODE_PATH="$(dirname -- "$(readlink -f -- "$0")")/node_modules" exec node -e \
  'require("esm")(module)(require("path").resolve(process.cwd(),
  process.argv[1]))' "$0" "$@"; */;

// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

import "./node-shims.js";
import {NIC, parseMAC, cidrToSubnet, RecordStream, blobToArrayBuffer} from "./webnetwork.js";
import net from "net";
import TransformStream from "./lib/transform-stream.js";
import WebSocket from "ws";
import {VDEParser, makeVDEGenerator} from "./lib/vde-parser.js";
import {iteratorStream, wrapWritable, transformToUint8Array} from "./lib/node-streams.js";
import {makeWSStream} from "./lib/websocket-stream.js";
import {vdePlugStream} from "./lib/vde-plug-stream.js";
import socks from "@heroku/socksv5";
import {registerProtocol} from "./lib/register-protocol.js";
import {registerProtocol as registerProtocolXDG} from "./lib/register-protocol-xdg.js";
import opn from "opn";
import {startEaas} from "./lib/node-eaas-client.js";
import identify from "./lib/identify-git";
import fs from "fs";
const {writeFile} = fs.promises;

const PROTOCOL = "web+eaas-proxy";

const {
  DEBUG_RECORD_TRAFFIC,
  EAAS_PROXY_READY_PATH,
} = process.env;

const resolveName = async (dstAddr, nic) => {
  if (!(dstAddr.match(/^\d{1,3}(\.\d{1,3}){3}$/) || dstAddr.match(/:/))) {
    const ip = await nic.getAddr(dstAddr);
    console.log(dstAddr, "->", ip);
    dstAddr = ip;
  }
  return dstAddr;
};

(async () => {
  console.log(`Version: ${await identify()}`);
  if (process.argv.length < 3) {
    if (process.platform === "win32") {
      await registerProtocol(PROTOCOL, process.argv[0]);
    }
    else if (process.platform === "linux") {
      await registerProtocolXDG(PROTOCOL, process.argv[0]);
    }
    await opn("https://gitlab.com/emulation-as-a-service/eaas-proxy/blob/master/INSTALL", {
      wait: false,
      ...(process.platform === "linux" ? {app: "xdg-open"} : {})
    });
    return;
  }

  const paramsOrig = process.argv.slice(2);
  let params = paramsOrig;

  if (params[0].match(/https?:/)) {
    params[0] = await (await startEaas(params[0])).getProxyURL();
  }

  if (params[0].startsWith(`${PROTOCOL}:`)) {
    const query = decodeURIComponent(new URL(params[0]).search.slice(1));
    params = JSON.parse(query);
    for (const [i, v] of paramsOrig.slice(1).entries()) {
      if (v) params[i] = v;
    }
  }

  if (params[1].match(/^https?:\/\//)) {
    const url = await (await startEaas(params[1])).wsConnection();
    // Security: wsConnection() MUST not return a socket path!
    if (!url.match(/^wss?:\/\//)) throw new RangeError(url);
    params[1] = url;
  }
  // HACK: Get rid of `window` for Emscripten to work properly.
  delete global.window;

  const [
    externalIPPortString,
    wsURLorSocketname,
    MACString,
    internalIPCIDR,
    targetIPOrSOSCKS,
    targetPortString,
  ] = params;

  // DEBUG
  console.log(params);
  process.stdin.read();

  const useWS = !!wsURLorSocketname.match(/^(ws:|wss:)\/\//);
  if (useWS) console.error("Using WebSocket.");

  const [scheme, username, password] = targetIPOrSOSCKS.split(/:/g);

  const useSOCKS5 = scheme === "socks5";
  if (useSOCKS5) console.error("Using SOCKS5.");

  const [externalIP, externalPortString] =
    externalIPPortString.includes(":") ? externalIPPortString.split(/:/) : ["", externalIPPortString];
  const externalPort = parseInt(externalPortString);
  const MAC = parseMAC(MACString); // TODO: Actually use this MAC, use random MAC if missing/empty string
  const useDHCP = internalIPCIDR === "dhcp";
  const [internalIP, subnet] = cidrToSubnet(internalIPCIDR);
  const targetPort = parseInt(targetPortString);

  const VDEPLUG = process.env.VDEPLUG && process.env.VDEPLUG.split(" ");

  const nic = await new NIC;
  console.log("eaas-proxy's MAC address:",
    Array.from(nic.mac, v=>v.toString(16).padStart(2, 0)).join(":"));

  let sendStream, receiveStream;
  if (DEBUG_RECORD_TRAFFIC) {
    sendStream = new RecordStream();
    receiveStream = new RecordStream(sendStream.recorder.data);
    process.on("SIGINT", async () => {
      await writeFile(DEBUG_RECORD_TRAFFIC, new Uint8Array(await blobToArrayBuffer(sendStream.getDump())));
      process.exit(0);
    });
  }
  {
    let chain = nic.readable;
    if (DEBUG_RECORD_TRAFFIC) chain = chain.pipeThrough(sendStream);
    chain = chain.pipeThrough(makeVDEGenerator())
    .pipeThrough(useWS ? makeWSStream(wsURLorSocketname)
      : vdePlugStream(wsURLorSocketname, VDEPLUG))
    .pipeThrough(new VDEParser());
    if (DEBUG_RECORD_TRAFFIC) chain = chain.pipeThrough(receiveStream);
    chain = chain.pipeThrough(nic);
  }
  if (useDHCP) await nic.startDHCPClient();
  else nic.addIPv4(internalIP, subnet);

  const ready = async () => {
    if (EAAS_PROXY_READY_PATH) await writeFile(EAAS_PROXY_READY_PATH, "");
  };

  if (targetIPOrSOSCKS === "dhcpd") {
    console.log("Starting DHCP server:", nic.startDHCPServer(internalIP));
    ready();
  } else if (useSOCKS5) {
    socks.createServer(async (info, accept, deny) => {
      console.log(info);
      const dstIP = await resolveName(info.dstAddr, nic);
      // Fail if address could not be resolved by DNS
      if (!dstIP) return deny();
      const c = accept(true);
      const socket1 = {
        readable: iteratorStream(c).pipeThrough(transformToUint8Array()),
        writable: wrapWritable(c),
      }
      const socket2 = new nic.TCPSocket(dstIP, info.dstPort);
      socket1.readable.pipeThrough(socket2).pipeThrough(socket1);
    }).useAuth(username ?
      socks.auth.UserPassword((_username, _password, accept) =>
        accept(_username === username && _password === password)) :
      socks.auth.None()).listen(externalPort, ready);
  } else {
    net.createServer(async (c) => {
      const socket1 = {
        readable: iteratorStream(c).pipeThrough(transformToUint8Array()),
        writable: wrapWritable(c),
      };
      const dstIP = await resolveName(targetIPOrSOSCKS, nic);
      // Fail if address could not be resolved by DNS
      if (!dstIP) {
        socket1.readable.cancel();
        socket1.writable.abort();
        return;
      }
      const socket2 = new nic.TCPSocket(dstIP, targetPort);
      socket1.readable.pipeThrough(socket2).pipeThrough(socket1);
    }).listen(externalPort, ...(externalIP ? [externalIP] : []), ready);
  }
})().catch(console.log);
