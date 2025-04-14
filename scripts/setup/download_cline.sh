#!/bin/bash

# Set the repository URL
REPO_URL="git@github.com:cline/cline.git"
REPO_DIR="cline"

# Check if the repository already exists
if [ ! -d "$REPO_DIR" ]; then
  # Clone the repository
  echo "Cloning the repository..."
  git clone "$REPO_URL" "$REPO_DIR"
  if [ $? -ne 0 ]; then
    echo "Error cloning the repository."
    exit 1
  fi
else
  # Pull the latest version
  echo "Pulling the latest version..."
  if [ "$1" == "--pull" ]; then
    cd "$REPO_DIR"
    git pull
    if [ $? -ne 0 ]; then
      echo "Error pulling the latest version."
      exit 1
    fi
    cd ..
  else
    echo "Repository already exists. Use --pull to update."
  fi
fi

echo "Done."
