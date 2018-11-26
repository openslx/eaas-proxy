// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

import {broadcastStream} from "../lib/broadcast-stream.js";
import {EthernetParser, IPv4Parser} from "../lib/network-parser.js";
import TransformStream from "../lib/transform-stream.js";

const printer = (tag, ...args) => new TransformStream({
    transform(v, c) {
        console.log(...(tag ? [tag] : []), v);
        c.enqueue(v);
    }
});

self.data = new Proxy([pcapHeader], {
    get(target, key, receiver) {
        const ret = Reflect.get(target, key, receiver);
        if (key !== "push") return ret;
        return new Proxy(ret, {
            apply(...a) {
                const ret = Reflect.apply(...a);
                try {target.notify();} catch {}
                return ret;
            }
        })
    }
});

(async () => {
    const broadcast = broadcastStream("ethernet");
    const printer1 = printer("ethernet");
    const printer2 = printer("ip");
    broadcast.readable
        .pipeThrough(new RecordStream(data))
        .pipeThrough(new EthernetParser)
        .pipeThrough(printer1)
        .pipeThrough(new IPv4Parser)
        .pipeThrough(printer2)
        .pipeTo(new WritableStream);
})();

import {saveAs} from "../webnetwork.js";
import {pcapHeader, RecordStream, StreamPrinter, Uint8ArrayStream} from "../webnetwork.js";

customElements.define("save-pcap", class extends HTMLElement {
    constructor() {
        super();
        this.data = self[this.getAttribute("data")];
        this.addEventListener("click", () => {
            saveAs(new Blob(this.data), this.getAttribute("download"));
        });
    }
});

customElements.define("array-counter", class extends HTMLElement {
    constructor() {
        super();
        this.data = self[this.getAttribute("data")];
        this.textContent = this.data.length;
        data.notify = () => {
            this.textContent = this.data.length;
        };
    }
});
