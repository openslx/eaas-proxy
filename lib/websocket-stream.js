// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

export const makeWSStream = url => {
  const ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";
  const readable = new ReadableStream({
    start(c) {
      ws.addEventListener("message", ev => c.enqueue(new Uint8Array(ev.data)));
    },
  });
  const writable = new WritableStream({
    async start() {
      await new Promise(r => ws.addEventListener("open", r));
    },
    write(ch) {
      ws.send(ch);
    },
  });
  return {readable, writable};
};
