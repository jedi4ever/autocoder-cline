#!/usr/bin/env bash

pkill python3
nohup $HOME/.local/bin/uv run --project $HOME/autogui_env /autocoder/server/autocoderd.py &