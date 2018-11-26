/// <reference lib="webworker" />
/** @type {ServiceWorkerGlobalScope} */
const sw = self;

sw.onfetch = console.log;
