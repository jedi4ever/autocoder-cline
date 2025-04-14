PLUGIN_SRC_DIR=vscode-plugins
PLUGIN_BUILD_DIR=dist/vsix
PLUGIN_PATCHES_DIR=patches
VSCODE_CLINE_REPO_URL=git@github.com:cline/cline.git
VSCODE_VSCODE_REMOTE_REPO_URL=git@github.com:estruyf/vscode-remote-control.git

VSCODE_COMMAND=code-insiders

CONTAINER_NAME=autocoder-1
CONTAINER_IMAGE_NAME=autocoder

WORKSPACES_DIR=workspaces
PROJECT_NAME=pat

##########################
# build the plugins
##########################

# Clone the repos
vscode-repo-clone:
	@echo "Fetching repositories..."
	mkdir -p $(PLUGIN_SRC_DIR)
	git clone $(VSCODE_CLINE_REPO_URL) $(PLUGIN_SRC_DIR)/cline
	cd $(PLUGIN_SRC_DIR)/cline ; git checkout b3b074d90a084b1ebe2d3cd70d75b4a32ac8521e
	git clone $(VSCODE_VSCODE_REMOTE_REPO_URL) $(PLUGIN_SRC_DIR)/vscode-remote-control

# Patch the repos
vscode-repo-patch:
	@echo "Patching dirs"
	cp $(PLUGIN_PATCHES_DIR)/cline/src/extension.ts $(PLUGIN_SRC_DIR)/cline/src/extension.ts
	cp $(PLUGIN_PATCHES_DIR)/vscode-remote-control/src/extension.ts $(PLUGIN_SRC_DIR)/vscode-remote-control/src/extension.ts
	cp $(PLUGIN_PATCHES_DIR)/vscode-remote-control/package.json $(PLUGIN_SRC_DIR)/vscode-remote-control/package.json

vscode-build-all: vscode-make-dist vscode-cline-build-mac vscode-cline-build-linux vscode-remote-build-linux
	@echo "done"

vscode-make-dist:
	mkdir -p $(PLUGIN_BUILD_DIR)

# nvm use v20.18.2
# https://github.com/cline/cline/issues/2556
# tsconfig.app.json:21:3 - error TS5023: Unknown compiler option 'noUncheckedSideEffectImports'.
# fixed by doing the install:all first
vscode-cline-compile:
	cd $(PLUGIN_SRC_DIR)/cline ; npm run install:all
	cd $(PLUGIN_SRC_DIR)/cline ; npm run compile
	cd $(PLUGIN_SRC_DIR)/cline ; npm install @vscode/vsce

vscode-cline-build-mac: vscode-cline-compile
	cd $(PLUGIN_SRC_DIR)/cline ; ./node_modules/.bin/vsce package -o ../../$(PLUGIN_BUILD_DIR)/claude-dev-darwin-arm64.vsix -t darwin-arm64

vscode-cline-build-linux: vscode-cline-compile
	cd $(PLUGIN_SRC_DIR)/cline ; ./node_modules/.bin/vsce package -o ../../$(PLUGIN_BUILD_DIR)/claude-dev-linux-arm64.vsix -t linux-arm64

vscode-remote-compile:
	# adapted extension.ts
	# update package.json with version of VSCode
	# npm update (to fix ssl)
	cd $(PLUGIN_SRC_DIR)/vscode-remote-control ; npm update
	cd $(PLUGIN_SRC_DIR)/vscode-remote-control ; npm install @vscode/vsce
	cd $(PLUGIN_SRC_DIR)/vscode-remote-control ; npm run compile

vscode-remote-build-linux: vscode-remote-compile
	cd $(PLUGIN_SRC_DIR)/vscode-remote-control ; ./node_modules/.bin/vsce package -o ../../$(PLUGIN_BUILD_DIR)/vscode-remote-control-linux-arm64.vsix -t linux-arm64

vscode-cline-install-local:
	$(VSCODE_COMMAND) --install-extension $(PLUGIN_BUILD_DIR)/claude-dev-darwin-arm64.vsix

vscode-remote-install-local:
	$(VSCODE_COMMAND) --install-extension $(PLUGIN_BUILD_DIR)/vscode-remote-control-linux-arm64.vsix

##########################
# docker commands
##########################
# make sure start docker/rancher desktop

docker-run-kasm:
	docker run --rm -it --shm-size=512m -p 6901:6901 -e VNC_PW=password kasmweb/vs-code:1.16.0

# Our custom build
docker-build:
	docker build -t $(CONTAINER_IMAGE_NAME) .

docker-build-clean:
	docker build --no-cache -t $(CONTAINER_IMAGE_NAME) .

docker-clean:
	docker rm -f $(CONTAINER_NAME) || true
	docker rmi $(CONTAINER_IMAGE_NAME) || true

# disable vnc -e VNCOPTIONS=-disableBasicAuth
# port 3710 - VSCode Remote plugin
# port 6901 - VNC
# port 8000 - Autocoder 
# add -i to make it work in interactive mode
# add -d to run it in the background

docker:
	docker run -d -i --name $(CONTAINER_NAME) -v `pwd`/$(WORKSPACES_DIR)/$(PROJECT_NAME):/project \
	 -v `pwd`/scripts:/scripts -v `pwd`/dist/vsix:/vsix -v `pwd`/src/autocoder:/autocoder\
	 --rm -it --shm-size=512m \
	 -p 3710:3710 -p 6901:6901 -p 8000:8000 \
	 -e VNCOPTIONS=-disableBasicAuth -e VNC_PW=password \
	 $(CONTAINER_IMAGE_NAME)

docker-install-vscode-extensions:
	docker exec -it $(CONTAINER_NAME) code --install-extension /vsix/claude-dev-linux-arm64.vsix
	docker exec -it $(CONTAINER_NAME) code --install-extension /vsix/vscode-remote-control-linux-arm64.vsix

shell:
	docker exec -it $(CONTAINER_NAME) /bin/bash

##########################
# autocoder execution
##########################
# alias for quick access
server: autocoderd

# We kill the server first , this because Docker does not handle Ctrl-C correctly with init 1
# with - we ignore the error of the kill command
autocoderd:
	sleep 4
	-docker exec $(CONTAINER_NAME) pkill python3
	docker exec $(CONTAINER_NAME) .local/bin/uv run --project autogui_env /autocoder/server/autocoderd.py

clean:
	rm -rf ./$(WORKSPACES_DIR)/$(PROJECT_NAME)/
	mkdir ./$(WORKSPACES_DIR)/$(PROJECT_NAME)/

task: # task task.md
	uv run --with requests src/autocoder/client/rsender.py

setup:
	uv run --with requests src/autocoder/client/rsender.py --setup

#run:
#	open http://localhost:6901
#	docker exec $(CONTAINER_NAME) /scripts/setup-cline.sh
# docker exec $(CONTAINER_NAME) chmod +x /scripts/*.sh
#	docker exec $(CONTAINER_NAME) .local/bin/uv run --project autogui_env /scripts/keyboard.py


#daemon:
#	docker exec $(CONTAINER_NAME) /scripts/start-autocoderd.sh

# needs brew install parallel
start:
	nohup make docker &
	sleep 2
	make autocoderd &
	sleep 1
	open http://localhost:6901
	make setup

kill:
	docker kill $(CONTAINER_NAME)

start-clean:
	make clean
	make start

shot:
	make start-clean
	make task

cycle:
	make vscode-cline-build-linux
	make docker-build