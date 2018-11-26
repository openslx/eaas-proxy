// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

import childProcess from "child_process";
const {spawn} = childProcess;
import {iteratorStream, wrapWritable, transformToUint8Array} from "./node-streams.js";

export const vdePlugStream = (socketname, command = ["vde_plug"]) => {
    const child = spawn(command[0], [...command.slice(1), socketname],
        {stdio: ["pipe", "pipe", process.stderr]});
    return {
        writable: wrapWritable(child.stdin),
        readable: iteratorStream(child.stdout).pipeThrough(transformToUint8Array()),
    };
};
