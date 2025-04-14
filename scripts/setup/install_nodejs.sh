#!/bin/bash

# load nvm
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"

# Check if LTS version is already installed
if nvm ls | grep -q lts ; then
  echo "LTS version of Node.js is already installed."
else
  echo "Installing LTS version of Node.js..."
  nvm install --lts
fi

nvm use --lts
