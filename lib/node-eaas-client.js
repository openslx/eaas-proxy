// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

const globalThis = global;

import { getTokenUsingResourceOwnerPassword } from "./oauth-client.js";

import { Client } from "../eaas-client/eaas-client.js";
import { NetworkUtils } from "../eaas-client/lib/netUtils.js";
import { _fetch } from "../eaas-client/lib/util.js";

import fetch from "node-fetch";
import jsdomMod from "jsdom";
const {JSDOM} = jsdomMod;
import jQueryMod from "jquery";
import EventSource from "eventsource";

globalThis.window = globalThis;
globalThis.fetch = fetch;
globalThis.localStorage = {getItem() {} };

const window2 = new JSDOM().window;
globalThis.addEventListener = window2.addEventListener.bind(window2);
globalThis.jQuery = globalThis.$ = jQueryMod(window2);
globalThis.EventSource = EventSource;

export const connectToNetwork = async ({
    issuer,
    username,
    password,
    client_id,
    eaasBackendURL,
    networkId,
    networkName,
    networkLabel,
    localIP,
    localPort,
}) => {
    const { id_token, ...res } = await getTokenUsingResourceOwnerPassword({
        issuer,
        username,
        password,
        client_id,
    });

    const eaasClient = new Client(eaasBackendURL, id_token);
    const netUtils = new NetworkUtils(eaasBackendURL, id_token);
    const session = await netUtils.connectNetworkSession(
        eaasClient,
        networkId,
        networkName
    );

    const realSession = await _fetch(
        `${eaasClient.API_URL}/sessions/${session.id}`,
        "GET",
        null,
        eaasClient.idToken
    );
    eaasClient.load(realSession);

    const { componentId } = eaasClient.network.networkConfig.components.find(
        (e) => e.networkLabel === networkLabel
    );

    const componentSession = eaasClient.getSession(componentId);
    const {
        serverPorts: [serverPort],
        serverIp,
    } = componentSession.network.getNetworkConfig(componentId);

    componentSession.network.sessionId = session.id;
    const proxyURL = await componentSession._getProxyURLRaw({
        serverIp,
        serverPort,
        gatewayIP: "dhcp",
        localIP,
        localPort,
    });
    return proxyURL;
};

export const startEaas = async (url) => {
    const urlParsed = new URL(url)
    const params = new URLSearchParams(urlParsed.hash.slice(1));
    urlParsed.hash = "";
    // Allow to connect to an exisiting network via
    // https://eaas.example/api-url/#networkID=f61f1d5e-59f9-4377-b266-4b4e40a25505
    if (params.has("networkID")) {
        const client = new Client(String(urlParsed));
        client.networkId = params.get("networkID");
        return client;
    }
    const res = await fetch(url);
    const url2 = new URL(res.url);
    const config = await (await fetch(new URL("config.json", url2))).json();
    const id = url2.searchParams.get("id");
    const envURL = new URL(
        `EmilEnvironmentData/getEnvById?${new URLSearchParams({id})}`,
        config.eaasBackendURL);
    const envJSON = await (await fetch(envURL)).json();
    const env = envJSON.emilEnvironment || envJSON;
    const eaasClient = new Client(config.eaasBackendURL);

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
