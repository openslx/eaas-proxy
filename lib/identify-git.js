// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

import fsMod from "fs-extra";
const fs = fsMod.promises;
import util from "util";
import child_process from "child_process";
const execFile = util.promisify(child_process.execFile);

export default async () => {
    try {
        return (await import("../COMMIT.js")).default;
    } catch {}
    try {
        return (await execFile("git", ["rev-parse", "HEAD"])).stdout;
    } catch {}
};
