# cline-autocoder
## Introduction
- `cline-autocoder` aims to to automate the cline AI coding tool

Highly experimental for now !!

## How it works
- Base Container : container image based on kasm-vnc vscode
- Cline VSCode Plugin : a modified cline VSCode extension : to allow for extra commands
- VSCode Remote control Plugin : a modified  vscode-remote control (opens a websocket in vcode)
- Autocoderd : python REST api to execute commands

## Components
### KASM Container 
- enable sudo to install packages
- disable SSL to avoid insecure browser warning
- volume scripts is mapped in container 
- volume dist/vsix is mapped in container
- volume src/
- volume workspaces/ is mapped in container

### Cline Plugin
- we set anthropic as provider & set the key
- we disable telemetry
- we set the cline instructions
- we disable notifications
- make sure we send updates to cline webview reloads
- patches in patches/cline

### VSCode Remote plugin 
- by default it listens to 127.0.0.1 , we bind it to 0.0.0.0 in the container
- set in vscode-setting.json
- port is forwarded by docker
- patches in patches/vscode-remote-plugin

### VScode setup
- code command needs --no-sandbox flag
- scripts/config/vscode-settings.json go into user settings
- we set the keystore to basic as it complains in linux about the keyring
- we trust all repo dir in settings

### Autocoderd
- use pyautogui to send text and do clicks
- this needs gnome-screenshot packages and some extra

- we put vscode in Light high contrast mode to make it detect text
- use pytesseract to locate text on the screen

- port 8000 is forwarded by Docker

- TODO: autolaunch autocoderd in docker (override entrypoint)

### Autocoder
- use a client to contact the autocoderd running


## Setup order
- `make vscode-repo-clone`
- `make vscode-repo-patch`
- `make vscode-build-all`
- `make docker-build`
- `make docker`

- connect to running vscode `http://localhost:6901/`

- `make server` in a separate shell
- `make run` to invoke the first


# License
MIT