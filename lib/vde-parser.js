// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

import TransformStream from "./transform-stream.js";

export class VDEParser extends TransformStream {
    // No WebSocket message has more than 1500 octets; however,
    // Ethernet frames (and VDE headers) may be arbitrarily
    // spreaded over several messages. There can also be several
    // Ethernet frames per WebSocket message.
    constructor(websocketStream) {
        /** @type {Uint8Array} */
        let leftover = null;
        /** @type {Uint8Array} */
        let leftoverHeader = null;
        super({
            /**
             * @param {Uint8Array} chunk
             * @param {*} controller
             */
            transform(chunk, controller) {
                if (leftover) {
                    const chunkLength = chunk.length;
                    leftover.set(chunk.subarray(0, leftover.length));
                    chunk = chunk.subarray(leftover.length);
                    leftover = leftover.subarray(chunkLength);
                    if (leftover.length === 0) {
                        controller.enqueue(new Uint8Array(leftover.buffer));
                        leftover = null;
                    }
                }
                for (; chunk.length;) {
                    if (chunk.length == 1) {
                        leftoverHeader = chunk;
                        return;
                    }
                    // Read VDE header (unsigned integer length of following
                    // Ethernet frame as 2 octets in big-endian format).
                    // @see <https://github.com/virtualsquare/vde-2/blob/6736126558ee915459e0a03bdfb223f8454bda7a/src/lib/libvdeplug.c#L740>
                    let length;
                    if (leftoverHeader) {
                        length = leftoverHeader[0] << 8 | chunk[0];
                        leftoverHeader = null;
                        chunk = chunk.subarray(1);
                    } else {
                        length = chunk[0] << 8 | chunk[1];
                        chunk = chunk.subarray(2);
                    }
                    if (chunk.length >= length) {
                        controller.enqueue(chunk.subarray(0, length));
                        chunk = chunk.subarray(length);
                    } else {
                        leftover = new Uint8Array(length);
                        leftover.set(chunk);
                        leftover = leftover.subarray(chunk.length);
                        return;
                    }
                }
            }
        });
    }
}

export const makeVDEGenerator = () => new TransformStream({
    transform(ch, c) {
        const length = ch.byteLength;
        c.enqueue(new Uint8Array([length >> 8, length]));
        c.enqueue(ch);
    },
});

export {VDEParser as default};
