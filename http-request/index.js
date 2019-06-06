// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

import {broadcastStream} from "../lib/broadcast-stream.js";
import {NIC} from "../webnetwork.js";
import {get} from "../lib/idb-keyval.js";

const nic = new NIC();
(async () => {
    const broadcast = broadcastStream("ethernet");
    broadcast.readable.pipeThrough(await nic).pipeThrough(broadcast);
    (await nic).addIPv4(await get("clientIP"));
    for (const client of await clients.matchAll()) client.postMessage("");
})();

export const iterator = reader => ({
    [Symbol.asyncIterator]: function () {return this;},
    next: () => reader.read(),
    return: () => ({}),
});

self.requestHttp = async () => {
    const s = new (await nic).TCPSocket("192.168.5.5", 80);
    console.log(s);
    const w = s.writable.getWriter();
    w.write(new TextEncoder().encode("GET /\n"));
    w.close();
    // const r = s.readable.getReader();
    for await (const v of iterator(s.readable.getReader())) {
        console.log(new TextDecoder().decode(v));
    }
};

self.requestHttp2 = async ({url}) => {
    const s = new (await nic).TCPSocket(await get("serverIP"), await get("serverPort"));
    console.log(s);
    const w = s.writable.getWriter();
    w.write(new TextEncoder().encode(`GET ${url}\n`));
    // w.write(new TextEncoder().encode(`GET ${url} HTTP/1.0\r\n\r\n`));
    w.close();
    return s.readable;
    // const r = s.readable.getReader();
    for await (const v of iterator(s.readable.getReader())) {
        console.log(new TextDecoder().decode(v));
    }
};

self.onfetch = ev => ev.waitUntil((async () => {
    console.log(ev.request);
    const url = new URL(ev.request.url);
    if (url.origin !== self.origin) return;
    if (url.pathname.match(/^\/(%40%40%40|@@@)\//)) return;
    ev.respondWith((async () => {
      const body = await requestHttp2(ev.request);
      console.log("BODY", body);
      return new Response(body);
    })());
})());
