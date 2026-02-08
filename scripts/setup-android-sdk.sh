#!/usr/bin/env bash
# One-time setup: install Android SDK components (no sudo).
# Requires: Java (sudo apt install -y openjdk-17-jdk) and the cmdline-tools zip
#           already extracted to ~/Android/Sdk/cmdline-tools/latest (see FLUTTER_SETUP.md).

set -e
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"

if ! command -v java &>/dev/null; then
  echo "Install Java first: sudo apt install -y openjdk-17-jdk"
  exit 1
fi

echo "Accepting SDK licenses..."
yes | sdkmanager --sdk_root="$ANDROID_HOME" --licenses || true

echo "Installing platform-tools, build-tools, platform android-34..."
sdkmanager --sdk_root="$ANDROID_HOME" \
  "platform-tools" \
  "build-tools;34.0.0" \
  "platforms;android-34"

echo "Android SDK setup done. Add to your shell (e.g. .bashrc):"
echo "  export ANDROID_HOME=\"\$HOME/Android/Sdk\""
echo "  export PATH=\"\$PATH:\$ANDROID_HOME/platform-tools\""
echo "Then run: flutter config --android-sdk \$ANDROID_HOME"
