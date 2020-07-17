// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

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

import streams from "web-streams-polyfill";
global.ReadableStream = streams.ReadableStream;
global.WritableStream = streams.WritableStream;

// global.crypto = new (require("node-webcrypto-ossl"));
import {randomFillSync} from "crypto";
global.crypto = {
  getRandomValues(buffer) {
    return randomFillSync(buffer);
  }
};

import textEncoding from "text-encoding";
Object.assign(global, textEncoding);

import vblob from "vblob";
global.Blob = vblob.Blob;
global.FileReader = vblob.FileReader;
global.self = global;

import WebSocket from "ws";
global.WebSocket = WebSocket;
