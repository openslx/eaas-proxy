self.window = self;

importScripts("@@@/lib/xhr.js");
// importScripts("https://unpkg.com/browser-es-module-loader@0.4.1/dist/babel-browser-build.js");
// importScripts("https://unpkg.com/browser-es-module-loader@0.4.1/dist/browser-es-module-loader.js");
importScripts("https://cdn.jsdelivr.net/gh/rafaelgieschke/browser-es-module-loader@master/dist/babel-browser-build.js");
importScripts("https://cdn.jsdelivr.net/gh/rafaelgieschke/browser-es-module-loader@master/dist/browser-es-module-loader.js");

var loader = new BrowserESModuleLoader();
(async () => {
  console.log(loader);
  console.log(await loader.import("./@@@/http-request/index.js"));
})();

self.oninstall = () => {
  skipWaiting();
}
self.onactivate = () => {
  clients.claim();
}

self.onfetch = () => {};
