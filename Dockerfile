from node:10
# gcc-multilib is needed for generating the 32-bit Windows binaries,
# zip is needed to pack eaas-proxy.app.zip for macOS.
run apt-get update && DEBIAN_FRONTEND="noninteractive" apt-get install -y gcc-multilib zip
workdir /src
copy package.json .
copy package-lock.json .
run npm install
# Prefetch Node.js binaries used by pkg(-fetch).
run \
  node_modules/.bin/pkg-fetch latest linux x64 && \
  node_modules/.bin/pkg-fetch latest win x86 && \
  node_modules/.bin/pkg-fetch latest macos x64 && \
  :
copy . .
# TODO: Move steps from package.json/prepublish to correct section.
run npm install --unsafe-perm
run git rev-parse HEAD
run npm run build
from ubuntu
copy --from=0 /src/eaas-proxy.exe /src/eaas-proxy.app.zip /src/eaas-proxy /opt/eaas-proxy/
cmd /opt/eaas-proxy/eaas-proxy
