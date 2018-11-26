// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

import EventHandlersMixin from "./event-handlers-mixin.js";

const bufferedTarget = 1000;

const readController = new WeakMap();
/** @type {WeakMap<FakeWebSocket, WritableStreamDefaultController>} */
const writeController = new WeakMap();
const readyState = new WeakMap();
const binaryType = new WeakMap();
const _url = new WeakMap();

const _dispatchEvent = (target, ev) => {
    setTimeout(() => target.dispatchEvent(ev));
    // Promise.resolve().then(() => target.dispatchEvent(ev));
};

export const FakeBaseClass = (fakeBase, constructorBase) => class extends fakeBase {
    constructor(...args) {
        return Reflect.construct(constructorBase, args, new.target);
    }
};

class FakeWebSocket extends EventHandlersMixin(FakeBaseClass(WebSocket, EventTarget), ["open", "error", "close", "message"]) {
    constructor(url) {
        super();
        const url2 = String(new URL(url));
        _url.set(this, url2);
        this.readable = new ReadableStream({
            start: controller => {
                readController.set(this, controller);
            },
            cancel: (reason) => this.close(0, reason),
        }, {
                highWaterMark: bufferedTarget,
                size(chunk) {
                    if (chunk.byteLength) return chunk.byteLength;
                    if (chunk.size) return chunk.size;
                    return chunk.length;
                }
            });
        this.writable = new WritableStream({
            start: (controller) => {
                readyState.set(this, 0);
                writeController.set(this, controller);
            },
            abort: () => {
                readyState.set(this, 4);
                const ev = new Event("error");
                this.dispatchEvent(ev);
            },
            close: () => {
                readyState.set(this, 4);
                const ev = new CloseEvent("close");
                this.dispatchEvent(ev);
            },
            write: async (data) => {
                if (binaryType.get(this) === "arraybuffer") {
                    if (!(data instanceof ArrayBuffer)) {
                        data = await new Response(data).arrayBuffer();
                    }
                }
                // Due to the `await`, `binaryType` might have changed
                // in the meantime; but there can only be a change from
                // "arraybuffer" to "blob".
                if (binaryType.get(this) === "blob") {
                    if (!(data instanceof Blob)) {
                        data = new Blob([data]);
                    }
                }
                const ev = new MessageEvent("message", {data});
                this.dispatchEvent(ev);
            },
        });
        this.addEventListener("open", () => console.log("OPENEND"));
        const ev = new Event("open");
        binaryType.set(this, "blob");
        setTimeout(() => {
            readyState.set(this, 1);
            this.dispatchEvent(ev);
        });
    }
    get bufferedAmount() {
        return bufferedTarget - readController.get(this).desiredSize;
    }
    get readyState() {
        return readyState.get(this);
    }
    get binaryType() {
        return binaryType.get(this);
    }
    set binaryType(val) {
        val = String(val);
        if (val !== "blob" && val !== "arraybuffer") return;
        binaryType.set(this, val);
    }
    get url() {
        return _url.get(this);
    }
    get extensions() {
        return "";
    }
    get protocol() {
        return "";
    }

    send(data) {
        readController.get(this).enqueue(data);
    }
    close(code, reason) {
        const ev = new CloseEvent("close", {
            code,
            reason,
            wasClean: true,
        });
        writeController.get(this).error();
        this.dispatchEvent(ev);
    }
}

export {FakeWebSocket as default};
