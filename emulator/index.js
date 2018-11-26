// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

import FakeWebSocket from "../lib/fake-web-socket.js";
import {broadcastStream} from "../lib/broadcast-stream.js";
import {get, set} from "../lib/idb-keyval.js";

self.WebSocket = new Proxy(WebSocket, {
    construct(target, args, newTarget) {
        const url = String(new URL(args[0], location));
        if (url === "wss://ethernet.invalid/") {
            const ws = new FakeWebSocket(url);
            connect(ws, broadcastStream("ethernet"));
            return ws;
        }
        return Reflect.construct(target, args, newTarget);
    }
});

function connect(transformStream1, transformStream2, analyzer12, analyzer21) {
    let readable1 = transformStream1.readable;
    let readable2 = transformStream2.readable;
    if (analyzer12) {
        readable1 = readable1.pipeThrough(analyzer12);
    }
    if (analyzer21) {
        readable2 = readable2.pipeThrough(analyzer21);
    }
    readable1.pipeTo(transformStream2.writable);
    readable2.pipeTo(transformStream1.writable);
}

set("clientIP", "192.168.5.1");
set("serverIP", "192.168.5.5");
set("serverPort", "80");

// cd v86; git apply ../v86-esm.patch; make
import V86Starter from "./v86/build/libv86.js";

self.emulator = new V86Starter({
    screen_container: document.getElementById("screen"),
    bios: {url: "./v86/bios/bochs-bios.bin"}, vga_bios: {url: "./v86/bios/bochs-vgabios.bin"},
    bios: {url: "./v86/bios/seabios.bin"}, vga_bios: {url: "./v86/bios/vgabios.bin"},
    cdrom: {url: "./rootfs.iso"},
    cdrom: {url: "https://raw.githubusercontent.com/rafaelgieschke/buildroot-image/master/image.iso"},
    // initial_state: { url: "./state.raw" },
    autostart: true,
    fastboot: true,
    network_relay_url: "wss://ethernet.invalid/",
});
