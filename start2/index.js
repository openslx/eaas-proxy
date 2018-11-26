// Copyright 2018 The Emulation-as-a-Service Authors.
// SPDX-License-Identifier: GPL-2.0-or-later

import Client from "../eaas-client/eaas-client.esm.js";
import {set, get} from "../lib/idb-keyval.js";

//navigator.serviceWorker.register("../module-loader.js?./start2/sw.js").then(console.log, console.log);

const fetchX = (...args) => {
    const req = new Request(...args);
    return fetch(`https://cors-anywhere.herokuapp.com/${req.url}`, req);
}

const startEaas = async (url) => {
    const res = await fetchX(url);
    console.log(res);
    console.log([...res.headers]);
    const url2 = new URL(res.headers.get("x-final-url"));
    console.log(url2);
    //const url2 = new URL(url);
    const config = await (await fetchX(new URL("config.json", url2))).json();
    const id = url2.searchParams.get("id");
    const envURL = new URL(
        `EmilEnvironmentData/getEnvById?${new URLSearchParams({id})}`,
        config.eaasBackendURL);
    const env = (await (await fetchX(envURL)).json()).emilEnvironment;
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

const url = "http://hdl.handle.net/...";

(async () => {
    const client = await startEaas(url);
    client.detach(1);
    const wsURL = await client.wsConnection();
    await set("wsURL", wsURL);
    console.log(await get("wsURL"));
    console.log(self.client = client);
})();
