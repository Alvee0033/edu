#!/usr/bin/env bash
# Build Flutter APK and install via ADB.
# Prereqs: run once: sudo apt install -y openjdk-17-jdk adb
#          AND Android SDK installed at ~/Android/Sdk (or set ANDROID_HOME).

set -e
EDU_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$EDU_ROOT/frontend"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$HOME/development/flutter/bin:$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

if [[ ! -d "$ANDROID_HOME/cmdline-tools/latest" ]]; then
  echo "Android SDK not found at $ANDROID_HOME. Run scripts/setup-android-sdk.sh first."
  exit 1
fi

if ! command -v java &>/dev/null; then
  echo "Java not found. Run: sudo apt install -y openjdk-17-jdk"
  exit 1
fi

# Install SDK components if missing
if [[ ! -d "$ANDROID_HOME/platform-tools" ]]; then
  echo "Installing Android SDK platform-tools and build-tools..."
  yes | sdkmanager --sdk_root="$ANDROID_HOME" \
    "platform-tools" \
    "build-tools;34.0.0" \
    "platforms;android-34"
fi

# Point Flutter at SDK
flutter config --android-sdk "$ANDROID_HOME"

# Build APK
echo "Building release APK..."
cd "$FRONTEND"
flutter build apk --release

APK="$FRONTEND/build/app/outputs/flutter-apk/app-release.apk"
if [[ ! -f "$APK" ]]; then
  echo "APK not found at $APK"
  exit 1
fi

# ADB install (use SDK adb if system adb not installed)
ADB="${ANDROID_HOME}/platform-tools/adb"
if [[ ! -x "$ADB" ]]; then
  ADB=adb
fi

if ! "$ADB" devices | grep -q 'device$'; then
  echo "No device/emulator found. Connect a device with USB debugging or start an emulator."
  echo "Then run: $ADB install -r $APK"
  exit 1
fi

echo "Installing APK on device..."
"$ADB" install -r "$APK"
echo "Done. App installed."
