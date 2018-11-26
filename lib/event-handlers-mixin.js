// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

/**
 * Extends a class by adding event handlers.
 * @mixin
 */
export default (SuperClass, eventNames) => {
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
