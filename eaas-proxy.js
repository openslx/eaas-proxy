// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

import "./node-shims.js";
import {NIC, parseMAC, cidrToSubnet} from "./webnetwork.js";
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

const PROTOCOL = "web+eaas-proxy";

(async () => {
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
  // HACK: Get rid of `window` for Emscripten to work properly.
  delete global.window;

  if (params[0].startsWith(`${PROTOCOL}:`)) {
    const query = decodeURIComponent(new URL(params[0]).search.slice(1));
    params = JSON.parse(query);
    for (const [i, v] of paramsOrig.slice(1).entries()) {
      if (v) params[i] = v;
    }
  }

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
  const [internalIP, subnet] = cidrToSubnet(internalIPCIDR);
  const targetPort = parseInt(targetPortString);

  const VDEPLUG = process.env.VDEPLUG && process.env.VDEPLUG.split(" ");

  const nic = await new NIC;
  nic.addIPv4(internalIP, subnet);
  nic.readable
    .pipeThrough(makeVDEGenerator())
    .pipeThrough(useWS ? makeWSStream(wsURLorSocketname)
      : vdePlugStream(wsURLorSocketname, VDEPLUG))
    .pipeThrough(new VDEParser())
    .pipeThrough(nic);

  if (useSOCKS5) {
    socks.createServer((info, accept, deny) => {
      console.log(info);
      const c = accept(true);
      const socket1 = {
        readable: iteratorStream(c).pipeThrough(transformToUint8Array()),
        writable: wrapWritable(c),
      }
      const socket2 = new nic.TCPSocket(info.dstAddr, info.dstPort);
      socket1.readable.pipeThrough(socket2).pipeThrough(socket1);
    }).useAuth(username ?
      socks.auth.UserPassword((_username, _password, accept) =>
        accept(_username === username && _password === password)) :
      socks.auth.None()).listen(externalPort);
  } else {
    net.createServer(async (c) => {
      const socket1 = {
        readable: iteratorStream(c).pipeThrough(transformToUint8Array()),
        writable: wrapWritable(c),
      };
      const socket2 = new nic.TCPSocket(targetIPOrSOSCKS, targetPort);
      socket1.readable.pipeThrough(socket2).pipeThrough(socket1);
    }).listen(externalPort, ...(externalIP ? [externalIP] : []));
  }
})().catch(console.log);
