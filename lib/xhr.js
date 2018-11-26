// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

/**
 * @fileOverview
 * A very incomplete `XMLHttpRequest` polyfill (liffylop) bringing old
 * technology (XHR) to new technology (`ServiceWorkerGlobalScope`).
 */

/**
 * Extends a class by adding event handlers.
 * @mixin
 */
const EventHandlersMixin = (SuperClass, eventNames) => {
    class EventHandlersMixin extends SuperClass {}
    const eventTargets = new WeakMap();
    for (const name of eventNames) {
        Object.defineProperty(EventHandlersMixin.prototype, `on${name}`, {
            get() {
                const eventHandlers = eventTargets.get(this);
                return eventHandlers && eventHandlers[name] || null
            },
            set(value) {
                if (!eventTargets.has(this)) {
                    eventTargets.set(this, Object.create(null));
                }
                const eventHandlers = eventTargets.get(this);
                if (!eventHandlers[name]) {
                    this.addEventListener(name, function (...args) {
                        if (!eventHandlers[name]) return;
                        return eventHandlers[name].apply(this, args);
                    });
                }
                eventHandlers[name] = value;
            },
        });
    }
    return EventHandlersMixin;
}

class XMLHttpRequest extends EventHandlersMixin(EventTarget, ["readystatechange"]) {
    open(method, url) {
        this._method = method;
        this._url = url;
    }
    send(body = null) {
        (async () => {
            const res = await fetch(this._url, {method: this._method, body});
            const text = await res.text();
            this.readyState = 4;
            this.status = 0;
            this.responseText = text;
            this.dispatchEvent(new Event("readystatechange"));
        })();
    }
}
