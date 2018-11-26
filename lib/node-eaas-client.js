// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

const globalThis = global;

import fetch from "node-fetch";
import {JSDOM} from "jsdom";
import jQueryMod from "jquery";
import EaasClient from "../eaas-client/eaas-client.esm.js";

globalThis.window = globalThis;
globalThis.fetch = fetch;
globalThis.localStorage = {getItem() {} };

const window2 = new JSDOM().window;
globalThis.jQuery = globalThis.$ = jQueryMod(window2);

export const startEaas = async (url) => {
    const res = await fetch(url);
    const url2 = new URL(res.url);
    const config = await (await fetch(new URL("config.json", url2))).json();
    const id = url2.searchParams.get("id");
    const envURL = new URL(
        `EmilEnvironmentData/getEnvById?${new URLSearchParams({id})}`,
        config.eaasBackendURL);
    const env = (await (await fetch(envURL)).json()).emilEnvironment;
    const eaasClient = new EaasClient(config.eaasBackendURL);

    await eaasClient.start([{
        data: {
            type: "machine",
            environment: env.envId,
        },
        visualize: false,
    }], {
            tcpGatewayConfig: {
                serverPort: env.serverPort,
                serverIp: env.serverIp,
                gwPrivateIp: env.gwPrivateIp,
                gwPrivateMask: env.gwPrivateMask,
            },
        });
    return eaasClient;
};
