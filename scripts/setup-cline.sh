#!/usr/bin/env bash
echo "hello"

# remove welcome screen 
# remove questions on trust
# in settings.json

#mkdir -p pat
echo "opening project"
code -a --no-sandbox /project/
sleep 3

.local/bin/uv run --project autogui_env /scripts/keyboard.py

sleep 2
# configure cline keys
echo "{ \"command\": \"cline.patrick\" }" | websocat ws://127.0.0.1:3710

sleep 2
# open cline view
echo "{ \"command\": \"workbench.view.extension.claude-dev-ActivityBar\" }" | websocat ws://127.0.0.1:3710

# set light theme
echo "{ \"command\": \"workbench.action.toggleLightDarkThemes\" }" | websocat ws://127.0.0.1:3710

.local/bin/uv run --project autogui_env /scripts/close.py

# "workbench.colorTheme": "Visual Studio Light"
# needs light to recognize text
.local/bin/uv run --project autogui_env /scripts/locate.py

sleep 1
.local/bin/uv run --project autogui_env /scripts/keyboard.py

