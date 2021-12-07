// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

import process from "process";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// HACK: __dirname and require will be (globally) relative to THIS file
global.__dirname = new URL(".", import.meta.url).pathname;
global.require = require;

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);
setInterval = new Proxy(setInterval, {
  apply(target, thisArg, [fun, ...args]) {
    Reflect.apply(target, thisArg, [new Proxy(fun, {
      apply(...args) {
        try {
          Reflect.apply(...args);
        } catch (e) {
          console.error(e);
        }
      },
    }), ...args]);
  },
});

const streams = require("web-streams-polyfill");
global.ReadableStream = streams.ReadableStream;
global.WritableStream = streams.WritableStream;

// global.crypto = new (require("node-webcrypto-ossl"));
global.crypto = {
  getRandomValues(buffer) {
    return require("crypto").randomFillSync(buffer);
  }
};

Object.assign(global, require("text-encoding"));

global.Blob = require("vblob").Blob;
global.FileReader = require("vblob").FileReader;
global.self = global;

global.WebSocket = require("ws");
