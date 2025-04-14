FROM kasmweb/vs-code:1.16.0

RUN /usr/bin/code --list-extensions

##
## /vscode stuff
##

# BUGFIXES

# fixes broken delete of files
# RUN apt-get update && apt-get install gvfs-bin -y
USER root
RUN apt-get update

# Setup keyring - shold this be running as vscode ?
# https://www.codegrepper.com/code-examples/shell/Writing+login+information+to+the+keychain+failed+with+error+%27The+name+org.freedesktop.secrets+was+not+provided+by
RUN apt-get install gnome-keyring -y
RUN apt-get install libsecret-1-dev -y


### Sudo
RUN apt-get update \
    && apt-get install -y sudo \
    && echo 'kasm-user ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers \
    && rm -rf /var/lib/apt/list/*


USER 1000

# An OS keyring couldn't be identified for storing the encryption
# https://github.com/microsoft/vscode/issues/187338#issuecomment-1630300049
RUN mkdir -p ~/.vscode
# gnome
# You're running in a GNOME environment but the OS keyring is not available for encryption. Ensure you have gnome-keyring or another libsecret compatible implementation installed and running.
# RUN echo '{ "password-store": "gnome-keyring"}' > .vscode/argv.json
RUN echo '{ "password-store": "basic"}' > .vscode/argv.json

# https://code.visualstudio.com/docs/configure/settings
RUN mkdir -p .config/Code/User/
COPY scripts/config/vscode-settings.json .config/Code/User/settings.json

# https://github.com/estruyf/vscode-remote-control
RUN sudo wget -qO /usr/local/bin/websocat https://github.com/vi/websocat/releases/latest/download/websocat.x86_64-unknown-linux-musl
RUN sudo chmod +x /usr/local/bin/websocat

# install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# pyautogui
# source $HOME/.local/bin/env
# NOTE: You must install tkinter on Linux to use MouseInfo. Run the following: sudo apt-get install python3-tk python3-dev
RUN sudo apt-get -y install python3-tk python3-dev
RUN sudo apt-get -y install gnome-screenshot
RUN sudo apt-get -y install scrot
RUN sudo apt-get -y install tesseract-ocr
RUN mkdir -p autogui_env && cd autogui_env && ~/.local/bin/uv init && ~/.local/bin/uv add pyautogui && ~/.local/bin/uv add pytesseract

# https://github.com/kasmtech/workspaces-core-images/blob/0e60c7eb5f7d6a63f30831a1a3d53312be2ef429/src/common/startup_scripts/vnc_startup.sh#L64
# disable ssl
# https://github.com/kasmtech/workspaces-core-images/issues/2
USER root
RUN sed -i.bak 's/-sslOnly//' /dockerstartup/vnc_startup.sh
RUN sed -i.bak 's/require_ssl: true/require_ssl: false/' /usr/share/kasmvnc/kasmvnc_defaults.yaml
USER 1000

# for our daemon
RUN mkdir -p autogui_env && cd autogui_env && ~/.local/bin/uv add fastapi uvicorn httpx websockets


## Install nodejs
RUN mkdir -p nvm
# nvm environment variables
ENV NVM_DIR /home/kasm-user/nvm
# ENV NODE_VERSION 4.4.7
ENV NODE_VERSION=22.14.0

# install nvm
# https://gist.github.com/remarkablemark/aacf14c29b3f01d6900d13137b21db3a?permalink_comment_id=3958929
# https://github.com/creationix/nvm#install-script
# RUN curl --silent -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.2/install.sh | bash
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
# install node and npm

RUN . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION

# add node and npm to path so the commands are available
ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

# install vscode extensions
RUN mkdir -p vsix-repo
COPY dist/vsix/ vsix-repo/
COPY vscode-plugins/vscode-remote-control/src/extension.ts vsix-repo/remote-extension.ts 
RUN code --install-extension vsix-repo/vscode-remote-control-linux-arm64.vsix
COPY vscode-plugins/cline/src/extension.ts vsix-repo/cline-extension.ts
RUN code --install-extension vsix-repo/claude-dev-linux-arm64.vsix

# echo "{ \"command\": \"workbench.action.terminal.new\" }" | websocat ws://localhost:3710

# disable the welcome of vscode
# open a directory of code
# set the listener to 0.0.0.0 for the remote listener to allow port forwarding
# echo "{ \"command\": \"workbench.action.terminal.new\" }" | websocat ws://127.0.0.1:3710

# Disable trust
# disable welcome
# code -a --no-sandbox /project/

# sh /scripts/start-fast.sh
# extend entrypoint
# https://superuser.com/questions/1459466/can-i-add-an-additional-docker-entrypoint-script

#"Entrypoint": [
#    "/dockerstartup/kasm_default_profile.sh",
#    "/dockerstartup/vnc_startup.sh",
#    "/dockerstartup/kasm_startup.sh"
#],
