// importScripts(`https://emulation-as-a-service.gitlab.io/eaas-proxy/module-loader.js?${new URL(location.search.slice(1), location)}`);

self.window = self;

importScripts("https://emulation-as-a-service.gitlab.io/eaas-proxy/lib/xhr.js");
// importScripts("https://unpkg.com/browser-es-module-loader@0.4.1/dist/babel-browser-build.js");
// importScripts("https://unpkg.com/browser-es-module-loader@0.4.1/dist/browser-es-module-loader.js");
importScripts("https://cdn.jsdelivr.net/gh/rafaelgieschke/browser-es-module-loader@master/dist/babel-browser-build.js");
importScripts("https://cdn.jsdelivr.net/gh/rafaelgieschke/browser-es-module-loader@master/dist/browser-es-module-loader.js");

new BrowserESModuleLoader().import("https://emulation-as-a-service.gitlab.io/eaas-proxy/@@@/http-request/index.js");

self.oninstall = () => {
  skipWaiting();
};

self.onactivate = () => {
  clients.claim();
};

self.onfetch = () => {};
