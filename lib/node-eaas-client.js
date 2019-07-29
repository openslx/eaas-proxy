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
    const urlParsed = new URL(url)
    const params = new URLSearchParams(urlParsed.hash.slice(1));
    urlParsed.hash = "";
    // Allow to connect to an exisiting network via
    // https://eaas.example/api-url/#networkID=f61f1d5e-59f9-4377-b266-4b4e40a25505
    if (params.has("networkID")) {
        const client = new EaasClient(String(urlParsed));
        client.networkId = params.get("networkID");
        return client;
    }
    const url2 = new URL(res.url);
    const config = await (await fetch(new URL("config.json", url2))).json();
    const id = url2.searchParams.get("id");
    const envURL = new URL(
        `EmilEnvironmentData/getEnvById?${new URLSearchParams({id})}`,
        config.eaasBackendURL);
    const envJSON = await (await fetch(envURL)).json();
    const env = envJSON.emilEnvironment || envJSON;
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
