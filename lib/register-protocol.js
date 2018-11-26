// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

import Registry from "winreg";

const registerProtocol = async (protocol, path) => {
    // https://msdn.microsoft.com/en-us/windows/desktop/aa767914
    const reg1 = new Registry({
        hive: Registry.HKCU,
        key: `\\Software\\Classes\\${protocol}`,
    });
    await new Promise(r => reg1.create(r));
    await new Promise(r => reg1.set("", "REG_SZ", `URL:${protocol} Protocol`, r));
    await new Promise(r => reg1.set("URL Protocol", "REG_SZ", "", r));
    const reg2 = new Registry({
        hive: Registry.HKCU,
        key: `\\Software\\Classes\\${protocol}\\shell\\open\\command`,
    });
    await new Promise(r => reg2.create(r));
    await new Promise(r => reg2.set("", "REG_SZ", `"${path}" "%1"`, r));
};

export {registerProtocol};
