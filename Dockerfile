from node:16
# zip is needed to pack eaas-proxy.app.zip for macOS.
run apt-get update && DEBIAN_FRONTEND="noninteractive" apt-get install -y zip
workdir /src
copy package.json .
copy package-lock.json .
run npm install || :
# Prefetch Node.js binaries used by pkg(-fetch).
run node=node16 && \
  node_modules/.bin/pkg-fetch -n "$node" -p linux -a x64 && \
  node_modules/.bin/pkg-fetch -n "$node" -p win -a x64 && \
  node_modules/.bin/pkg-fetch -n "$node" -p macos -a x64 && \
  :
copy . .
# TODO: Move steps from package.json/prepublish to correct section.
run npm install
run git rev-parse HEAD
run npm run build
from ubuntu
copy --from=0 /src/eaas-proxy.exe /src/eaas-proxy.app.zip /src/eaas-proxy /opt/eaas-proxy/
cmd /opt/eaas-proxy/eaas-proxy
