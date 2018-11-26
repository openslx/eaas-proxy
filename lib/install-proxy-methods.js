// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

const installMethods = (baseClass, targetClass, discriminator) => {
    for (const method of Object.getOwnPropertyNames(targetClass.prototype)) {
        if (method === "constructor") continue;
        if (Object.prototype.hasOwnProperty.call(baseClass.prototype, method)) {
            const baseDescriptor = Object.getOwnPropertyDescriptor(baseClass.prototype, method);
            const targetDescriptor = Object.getOwnPropertyDescriptor(targetClass.prototype, method);
            if (typeof targetDescriptor.value === "function") {
                targetDescriptor.value = new Proxy(targetDescriptor.value, {
                    apply(target, thisArg, args) {
                        console.log(target, thisArg, args);
                        console.log(discriminator(thisArg), target);
                        if (!discriminator(thisArg)) return Reflect.apply(target, thisArg, args);
                        return Reflect.apply(baseDescriptor.value, thisArg, args);
                    }
                });
            }

            /*for (const type of ["get", "set", "value"]) {
                if (typeof targetDescriptor[type] === "function" && typeof baseDescriptor[type] === "function") {
                    targetDescriptor[type] = new Proxy(targetDescriptor[type], {
                    //    apply
                    });
                }
            }*/
            Object.defineProperty(targetClass.prototype, method, targetDescriptor);
        }
    }
};

/*
class FakeWebSocket extends Intercept(WebSocket) {
}
*/

const is = new WeakMap();
class FakeElement extends Element {
    constructor() {
        const x = {__proto__: Element.prototype};
        is.set(x, true);
        return x;
    }
    getAttribute(x) {
        return "HALLO";
    }
}
installMethods(FakeElement, Element, is.get.bind(is));
self.FakeElement = FakeElement;

export {installMethods as default};