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
3. If ADB says "insufficient permissions", add udev rules (one-time):

```bash
sudo cp scripts/51-android-udev.rules /etc/udev/rules.d/
sudo udevadm control --reload-rules && sudo udevadm trigger
# Unplug and replug the USB cable, then:
adb devices
```

4. Install the APK:

```bash
./scripts/build-and-install-apk.sh
```

Or install an already-built APK manually:

```bash
adb install -r frontend/build/app/outputs/flutter-apk/app-release.apk
```

If no device is connected, the script prints the path to the APK so you can run `adb install -r <path>` later.

## Optional: Android Studio

Alternatively, install [Android Studio](https://developer.android.com/studio); it will install the Android SDK and ADB. Then run `flutter config --android-sdk /path/to/sdk` and `flutter doctor -v`.

## Upgrade Flutter later

```bash
flutter upgrade
```
