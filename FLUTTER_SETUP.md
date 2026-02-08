# Flutter setup (this machine)

## What’s already done

- **SDK location:** `~/development/flutter`
- **PATH:** Added to `~/.bashrc`  
  `export PATH="$HOME/development/flutter/bin:$PATH"`

## Use in a new terminal

Either open a new terminal or run:

```bash
source ~/.bashrc
```

Then:

```bash
flutter --version
cd /home/alvee/Desktop/edu/frontend
flutter pub get
flutter run -d chrome   # run app in Chrome
# or
flutter run -d linux    # after installing Linux desktop deps
```

## Optional: Linux desktop development

To build/run the app as a Linux desktop app, install:

```bash
sudo apt-get install -y clang cmake ninja-build pkg-config libgtk-3-dev libstdc++-12-dev
```

Then run `flutter doctor -v` again; Linux toolchain should show ✓.

## Build APK and install via ADB

**One-time setup (requires sudo):**

```bash
sudo apt install -y openjdk-17-jdk adb
```

Android command-line tools are already under `~/Android/Sdk`. Install SDK components and accept licenses:

```bash
source ~/.bashrc
./scripts/setup-android-sdk.sh
```

**Build and install on a connected device:**

1. Enable **USB debugging** on your Android device (Settings → Developer options).
2. Connect the device via USB (or start an emulator).
3. Run:

```bash
./scripts/build-and-install-apk.sh
```

This builds a release APK, then installs it with `adb install -r`. If no device is connected, the script prints the path to the APK so you can run `adb install -r <path>` later.

## Optional: Android Studio

Alternatively, install [Android Studio](https://developer.android.com/studio); it will install the Android SDK and ADB. Then run `flutter config --android-sdk /path/to/sdk` and `flutter doctor -v`.

## Upgrade Flutter later

```bash
flutter upgrade
```
