// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

import {broadcastStream} from "../lib/broadcast-stream.js";
import {NIC} from "../webnetwork.js";

const iterator = reader => ({
    [Symbol.asyncIterator]: function () {return this;},
    next: () => reader.read(),
    return: () => ({}),
});

(async () => {
    self.nic = await new NIC(undefined, new Uint8Array([34, 250, 80, 37, 2, 130]));
    nic.readable.pipeThrough(broadcastStream("ethernet")).pipeThrough(nic);
    nic.addIPv4("192.168.5.9");
    const server = new nic.TCPServerSocket({localPort: 80, localAddress: "192.168.5.9"});
    console.log(server.readable)
    for await (const s of iterator(server.readable.getReader())) {
        (async () => {
            const req = new TextDecoder().decode((await s.readable.getReader().read()).value);
            const path = req.match(/^GET (\S+)/)[1];
            console.log(path);
            const w = s.writable.getWriter();

            w.write(new TextEncoder().encode("HTTP/1.1 200 OK\r\n\r\n"));
            w.releaseLock();
            (await tryRead(drop.fs, path)).body.pipeTo(s.writable);
            return;

            w.write(new TextEncoder().encode(`HTTP/1.1 200 OK
content-type: text/plain

YEAAHH

!`.replace(/\n/g, "\r\n").repeat(1000)));
            w.close();
            console.log("finished");
        })();
    }
})();


const domPromise = (thisArg, key, ...args) => new Promise((resolve, reject) =>
    thisArg[key](...args, resolve, reject)
);
self.domPromise = domPromise;
self.tryRead = async (fs, path) => {
    path = path.replace(/^\/+/g, "");
    try {
        const dir = await domPromise(fs, "getDirectory", path, {});
        const entries = await domPromise(dir.createReader(), "readEntries");
        return new Response(entries.map(v => v.name + (v.isDirectory ? "/" : "")).join("\n") + "\n");
        //    return new Response(entries.map(v => v.fullPath).join("\n") + "\n");
    } catch {}
    try {
        const file = await domPromise(fs, "getFile", path, {});
        const file2 = await domPromise(file, "file");
        return new Response(file2);
    } catch {}
    return new Response("BOOO: not found");
}

import {PolymerElement, html} from "https://unpkg.com/@polymer/polymer@3.0.0-pre.12/polymer-element.js";

customElements.define("eaas-drop", class extends PolymerElement {
    static get template() {
        return html`
            <style>
            :host {
                display: block;
                background: green;
                min-height: 300px;
            }
            #input {
                display: none;
            }
            </style>
            {{fs.fullPath}}
            <!-- <input type="file" id="input" on-change="_onInput" /> -->
        `;
    }
    static get properties() {
        return {
            files: {type: Array, notify: true},
            fs: {type: Object, notify: true},
        }
    }
    constructor() {
        console.log(new Error);
        super();
        this.files = [];
    }
    _onDrop(ev) {
        ev.preventDefault();
        console.log(ev.dataTransfer.items[0].webkitGetAsEntry());
        console.log(ev.dataTransfer.files.length);
        this.fs = ev.dataTransfer.items[0].webkitGetAsEntry()
        this.files = [...ev.dataTransfer.files];
    }
    _onClick(ev) {
        this.$.input.click();
    }
    _onInput(ev) {
        this.files = [...this.$.input.files];
    }
    ready() {
        this.setAttribute("tabindex", "0");
        this.setAttribute("aria-role", "button");
        this.addEventListener("dragover", ev => ev.preventDefault());
        this.addEventListener("drop", this._onDrop);
        this.addEventListener("click", this._onClick);
        super.ready();
    }


});


