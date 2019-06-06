import {get, set} from "https://emulation-as-a-service.gitlab.io/eaas-proxy/@@@/lib/idb-keyval.js";
export default async ({
    path, clientIP, serverIP, serverPort, apiURL, networkID
}) => {
    set("clientIP", clientIP);
    set("serverIP", serverIP);
    set("serverPort", serverPort);
    set("apiURL", apiURL);
    set("networkID", networkID);

    document.body.append(Object.assign(document.createElement("div"),
    { innerHTML: `
    <h1>Registering service worker ...</h1>
<h1 hidden="" id="doneLink"><a href="">Now reload the page</a></h1>
    `}));

    navigator.serviceWorker.onmessage = () => {
        doneLink.hidden = false;
    };
    const sw = await navigator.serviceWorker.register(`${path}/sw.js`);
    sw.update();
    await fetch("");
    doneLink.hidden = false;
};
