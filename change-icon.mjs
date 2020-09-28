#!/usr/bin/env node

import { promisify } from "util";
import { execFile as _execFile } from "child_process";
const execFile = promisify(_execFile);

import { argv } from "process";

import rcedit from "rcedit";

(async () => {
  const [exePath] = argv.slice(2);

  await execFile("convert", [
    "-resize",
    "128x128",
    "-extent",
    "128x128",
    "-gravity",
    "center",
    "./icon.png",
    "icon.ico",
  ]);
  await rcedit(exePath, {
    icon: "icon.ico",
  });
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
