// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

import TransformStream from "./transform-stream.js";

export const iteratorStream = (iterable, ...args) => {
  const it = Reflect.apply(iterable[Symbol.asyncIterator] ||
    iterable[Symbol.iterator], iterable, []);
  return new ReadableStream({
    async pull(c) {
      const {value, done} = await it.next();
      if (done) c.close();
      else c.enqueue(value);
    },
    cancel: () => it.return(),
  }, ...args);
};

export const wrapWritable = nodeStream => new WritableStream({
  start(c) {
    nodeStream.once("error", ev => {
      c.error(ev);
      nodeStream.destroy(ev);
    });
  },
  async write(ch) {
    if (nodeStream.write(ch)) return;
    await new Promise(r => nodeStream.once("drain", r));
  },
  async close() {
    nodeStream.end();
    await new Promise(r => nodeStream.once("finish", r));
  },
  abort(reason) {
    nodeStream.destroy(reason);
  },
});

export const fromNodeStream = nodeStream => ({
  writable: wrapWritable(nodeStream),
  readable: iteratorStream(nodeStream),
});

export const transformToUint8Array = () => new TransformStream({
  transform(ch, c) {
    console.log(c);
    c.enqueue(new Uint8Array(ch));
  }
});
