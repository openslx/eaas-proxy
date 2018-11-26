// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

import fsMod from "fs-extra";
const fs = fsMod.promises;
import util from "util";
import child_process from "child_process";
const execFile = util.promisify(child_process.execFile);
import os from "os";
const homedir = os.homedir;

// https://standards.freedesktop.org/desktop-entry-spec/latest/ar01s04.html
const escapeString = str =>
    str.replace(/\\/g, "\\\\").replace(/\n/g, "\n");

// https://standards.freedesktop.org/desktop-entry-spec/latest/ar01s07.html
const escapePath = str =>
    escapeString(`"${str.replace(/["`$\\]/g, "\\$&")}"`)

const registerProtocol = async (protocol, path) => {
    // https://standards.freedesktop.org/desktop-entry-spec/latest/ar01s06.html
    const desktop = `
        [Desktop Entry]
        Type=Application
        Version=1.1
        Name=${escapeString(protocol)}
        # HACK: Possibly due to <https://bugs.freedesktop.org/show_bug.cgi?id=92514>,
        # "Terminal=true" does not work for KDE.
        # Also, Firefox calls "g_app_info_launch_uris" directly,
        # which, eventually, searches for a fixed list of terminal,
        # none of which is installed on KDE by default
        # (resulting in no process being started at all!):
        # <https://gitlab.gnome.org/GNOME/glib/blob/8a96fca3908609407f59c8f5be8de982a76114c1/gio/gdesktopappinfo.c#L2498>.
        # Terminal=true
        # Exec=${escapePath(path)} %u
        Exec=env EXE=${escapePath(path)} URL=%u sh -c '${`
            test "$XDG_CURRENT_DESKTOP" = "KDE" && which konsole && exec konsole -e "$EXE" "$URL";
            which gnome-terminal && exec gnome-terminal -- "$EXE" "$URL";
            which xterm && exec xterm -e "$EXE" "$URL";
            exec "$EXE" "$URL"
        `.trim().split(/\n/).map(v => v.trim()).join(" ")}'
    `.trimStart().replace(/^\s+/mg, "");
    const dir = `${homedir()}/.local/share/applications`;
    await fsMod.mkdirp(dir);
    const desktopPath = `${dir}/${protocol}.desktop`;
    await fs.writeFile(desktopPath, desktop);
    await execFile("xdg-mime", ["default", `${protocol}.desktop`,
        `x-scheme-handler/${protocol}`]);
};

export {registerProtocol};
