import { NetworkStack, NIC, StreamPrinter } from "../webnetwork.js";

const timeout = (time_ms) => new Promise(r => setTimeout(r, time_ms));

/** @type {NIC} */
export let nic1;
/** @type {NIC} */
export let nic2;

(async () => {
    nic1 = await new NIC(await new NetworkStack());
    nic2 = await new NIC(await new NetworkStack());
    nic1.addIPv4("10.0.0.1", "255.255.255.0");
    nic1.readable.pipeThrough(new StreamPrinter("->"))
        .pipeThrough(nic2)
        .pipeThrough(new StreamPrinter("<-"))
        .pipeThrough(nic1);
    nic1.startDHCPServer("10.0.0.1");
    await timeout(1000);
    const ip2 = await nic2.startDHCPClient();
    console.log(ip2);
    const addr = await nic2.getAddr("example.com");
    console.log(addr);
})().then(console.log, console.error);
