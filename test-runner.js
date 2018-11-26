// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

const log = [];
function installProxy(target, name) {
    target[name] = new Proxy(target[name], {
        apply(target, thisArg, args) {
            log.push([name, ...args]);
            return Reflect.apply(target, thisArg, args);
        }
    });
}

for (const name of ["debug", "error", "info", "log", "warn"]) {
    installProxy(console, name);
}
export function finish() {
    const el = document.getElementById("console");
    const expected = el.textContent.trim();
    const output = JSON.stringify(log, undefined, 2);
    if (expected === output) {
        document.body.style.backgroundColor = "green";
    } else {
        document.body.style.backgroundColor = "red";
        el.textContent += output;
    }
}
