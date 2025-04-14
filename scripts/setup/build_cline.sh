cd cline
npm run install:all

# install vsce 
# https://code.visualstudio.com/api/working-with-extensions/publishing-extension
npm install @vscode/vsce

#   -o, --out <path>                Output .vsix extension file to <path> location (defaults to <name>-<version>.vsix)
#  -t, --target <target>           Target architecture. Valid targets: win32-x64, win32-arm64, linux-x64, linux-arm64,
#                                  linux-armhf, darwin-x64, darwin-arm64, alpine-x64, alpine-arm64, web
mkdir -p ../vsix
./node_modules/.bin/vsce package -o ../vsix/claude-dev-darwin-arm64.vsix -t darwin-arm64
./node_modules/.bin/vsce package -o ../vsix/claude-dev-linux-arm64 -t linux-arm64

#npm run test

# sudo apt update
# sudo apt install -y \
#  libatk1.0-0 libatk-bridge2.0-0 libxkbfile1 libx11-xcb1 \
#  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 \
#  libdrm2 libgtk-3-0 dbus xvfb