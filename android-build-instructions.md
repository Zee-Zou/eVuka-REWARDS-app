# Android Build Instructions for eVuka Rewards

## Prerequisites

- Node.js 16 or higher
- Java Development Kit (JDK) 17 or higher
- Android Studio (latest version)
- Android SDK installed via Android Studio
- Gradle 8.0 or higher

## Setup Steps

### 1. Install Capacitor CLI and Core

```bash
npm install @capacitor/cli @capacitor/core
```

### 2. Install Capacitor Android Platform

```bash
npm install @capacitor/android
```

### 3. Install Required Capacitor Plugins

```bash
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/camera @capacitor/push-notifications @capacitor/local-notifications @capacitor/app @capacitor/haptics @capacitor/network @capacitor/device @capacitor/storage @capacitor/keyboard @capacitor/preferences
```

### 4. Build the Web App

```bash
npm run build
```

### 5. Initialize Capacitor with your app information

This step is already done as the `capacitor.config.ts` file is already created.

### 6. Add Android Platform

```bash
npx cap add android
```

### 7. Copy Web Assets to Android Project

```bash
npx cap copy android
```

### 8. Update Android Project with Capacitor Config Changes

```bash
npx cap sync android
```

### 9. Open the Project in Android Studio

```bash
npx cap open android
```

## Building the App

### 1. Configure App Signing

#### Creating a Keystore

1. Open a terminal and navigate to your project root
2. Run the following command to create a keystore:

```bash
keytool -genkey -v -keystore android.keystore -alias evuka -keyalg RSA -keysize 2048 -validity 10000
```

3. Follow the prompts to enter your details
4. Remember the password you set - you'll need it for the next steps

#### Configure Keystore in Gradle

1. In Android Studio, open `android/app/build.gradle`
2. Add the following inside the android block:

```gradle
signingConfigs {
    release {
        storeFile file("../../android.keystore")
        storePassword "your-keystore-password"
        keyAlias "evuka"
        keyPassword "your-key-password"
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

3. Replace `your-keystore-password` and `your-key-password` with the passwords you set when creating the keystore

#### Google Play App Signing

For enhanced security, use Google Play App Signing:

1. In Google Play Console, go to your app > Setup > App integrity
2. Follow the steps to enroll in Play App Signing
3. Upload your app signing key when prompted
4. Download the upload key and certificate
5. Update your build.gradle to use the upload key for signing

### 2. Update App Icons and Splash Screen

1. Replace the placeholder icons in `android/app/src/main/res/mipmap-*` with your app icons
   - Use [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/) to generate proper icon sets
   - Include adaptive icons for Android 8.0+ (foreground and background layers)
   - Ensure icons follow [Material Design guidelines](https://material.io/design/iconography/product-icons.html)

2. Update splash screen resources in `android/app/src/main/res/drawable-*`
   - Create splash screen images for multiple densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
   - Follow the configuration in capacitor.config.ts for splash screen settings

### 3. Update App Name and Package

1. Open `android/app/src/main/res/values/strings.xml` and update the app name
2. If needed, update the package name in `android/app/build.gradle`
   - Ensure it matches the appId in capacitor.config.ts (com.evuka.rewards)
   - Update applicationId in the defaultConfig block
3. Update the package name in `android/app/src/main/AndroidManifest.xml`
4. Update the package name in `android/app/src/main/java/...` folder structure and Java files

### 4. Configure Permissions

Ensure the following permissions are in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

> Note: For Android 13+ (API 33+), use READ_MEDIA_IMAGES instead of READ_EXTERNAL_STORAGE. For Android 10+ (API 29+), WRITE_EXTERNAL_STORAGE is limited.

#### Runtime Permissions

For Android 6.0+ (API 23+), implement runtime permission requests for sensitive permissions:

1. Use Capacitor's permission plugins to request permissions at runtime
2. Add code to handle permission results and show explanations when needed
3. Implement graceful fallbacks when permissions are denied

### 5. Configure Android Specific Features

#### Notification Channels

For Android 8.0+ (API 26+), create notification channels:

1. In your MainActivity.java, add code to create notification channels on app startup
2. Define different channels for different types of notifications (e.g., rewards, promotions)
3. Set appropriate importance levels for each channel

#### Adaptive Icons

Implement adaptive icons for Android 8.0+ (API 26+):

1. Create foreground and background layers for your app icon
2. Add them to `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`

#### Dark Theme Support

Implement support for dark theme in Android 10+ (API 29+):

1. Create alternative resource files with `-night` qualifier
2. Use system colors that automatically adapt to theme changes

### 6. Build Release Version

#### Using Android Studio

1. In Android Studio, select `Build > Build Bundle(s) / APK(s) > Build Bundle(s)` for Play Store distribution
2. Or select `Build > Build Bundle(s) / APK(s) > Build APK(s)` for direct distribution

#### Using Command Line

```bash
cd android
./gradlew bundleRelease    # For Play Store (AAB)
./gradlew assembleRelease  # For direct distribution (APK)
```

The output files will be located at:
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

### 7. Test Release Build

Before submitting to the Play Store, test your release build:

1. Install the release APK on a test device:
   ```bash
adb install android/app/build/outputs/apk/release/app-release.apk
   ```
2. Test all critical functionality
3. Verify that all permissions work correctly
4. Check performance and resource usage
5. Test on multiple device sizes and Android versions

### 8. Optimize App Size

Reduce the size of your app bundle:

1. Enable R8 shrinking and obfuscation in build.gradle:
   ```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
   ```
2. Add necessary ProGuard rules to preserve essential code
3. Use Android App Bundle format to enable Play Asset Delivery
4. Optimize image assets using WebP format
5. Remove unused resources and libraries

## HarmonyOS Support

### 1. Install HMS Core Plugin

```bash
npm install @hmscore/hms-js
npm install @hmscore/react-native-hms-push
```

### 2. Configure HMS AppGallery Connect

1. Create an account on [AppGallery Connect](https://developer.huawei.com/consumer/en/service/josp/agc/index.html)
2. Create a new project and app with your package name
3. Download the `agconnect-services.json` file
4. Place the file in the `android/app` directory

### 3. Update Gradle Files

1. In `android/build.gradle`, add the HMS Maven repository:

```gradle
buildscript {
    repositories {
        // Other repositories
        maven { url 'https://developer.huawei.com/repo/' }
    }
    dependencies {
        // Other dependencies
        classpath 'com.huawei.agconnect:agcp:1.6.0.300'
    }
}

allprojects {
    repositories {
        // Other repositories
        maven { url 'https://developer.huawei.com/repo/' }
    }
}
```

2. In `android/app/build.gradle`, apply the HMS plugin:

```gradle
apply plugin: 'com.huawei.agconnect'
```

### 4. Implement HMS Core Services

#### Account Kit (Authentication)

Replace Google Sign-In with HMS Account Kit:

1. Add Account Kit dependency to build.gradle
2. Implement sign-in and account management using HMS Account Kit APIs
3. Test on Huawei devices without Google services

#### Push Kit (Notifications)

Replace Firebase Cloud Messaging with HMS Push Kit:

1. Add Push Kit dependency to build.gradle
2. Implement token registration and message handling
3. Update your server to send notifications through both FCM and HMS Push Kit

#### Map Kit (Location Services)

Replace Google Maps with HMS Map Kit:

1. Add Map Kit dependency to build.gradle
2. Implement map display and location services using HMS Map Kit APIs
3. Create a service abstraction layer to use either Google Maps or HMS Map Kit based on availability

#### Analytics Kit

Implement HMS Analytics Kit alongside Google Analytics:

1. Add Analytics Kit dependency to build.gradle
2. Implement event tracking using HMS Analytics Kit APIs
3. Create a unified analytics service that reports to both platforms

### 5. Build for HarmonyOS

```bash
cd android
./gradlew assembleRelease
```

The APK will work on both Android and HarmonyOS devices.

## Testing

### 1. Test on Emulator

```bash
npx cap run android
```

### 2. Test on Physical Device

1. Connect your device via USB with debugging enabled
2. Run the app from Android Studio or use:

```bash
npx cap run android --target=YOUR_DEVICE_ID
```

### 3. Automated Testing

1. Implement UI tests using Espresso:
   - Create test classes in `android/app/src/androidTest/`
   - Write tests for critical user flows
   - Run tests on multiple device configurations

2. Implement unit tests for Android-specific code:
   - Create test classes in `android/app/src/test/`
   - Mock dependencies and test isolated components
   - Run tests with `./gradlew test`

## Preparing for Play Store Submission

### 1. Create Developer Account

1. Sign up for a Google Play Developer account at [play.google.com/apps/publish](https://play.google.com/apps/publish)
2. Pay the one-time $25 registration fee
3. Complete account details and verification

### 2. Prepare Store Listing

1. Create a new application in the Play Console
2. Fill in all required metadata:
   - App name (matching the name in your app)
   - Short description (up to 80 characters)
   - Full description (up to 4000 characters)
   - App category and content rating
   - Contact details and website
   - Privacy policy URL

3. Prepare and upload graphics:
   - App icon (512 x 512 px)
   - Feature graphic (1024 x 500 px)
   - Screenshots for phone, tablet, and other supported devices
   - Promo video (optional)

### 3. Configure App Content

1. Complete the content rating questionnaire
2. Fill out the data safety section with all data collection practices
3. Set up pricing and distribution countries
4. Configure in-app products if applicable

### 4. Upload and Release

1. Upload your signed AAB file
2. Create a new release in the Production track (or use Closed Testing for initial testing)
3. Add release notes
4. Review and submit for approval

## Preparing for AppGallery Submission

1. Log in to [AppGallery Connect](https://developer.huawei.com/consumer/en/service/josp/agc/index.html)
2. Navigate to your app
3. Fill in all required metadata:
   - App name (up to 64 characters)
   - App description (up to 8000 characters)
   - App category and content rating
   - Privacy policy URL
   - Service regions

4. Upload graphics:
   - App icon (1024 x 1024 px)
   - Feature graphic (1080 x 720 px)
   - Screenshots (at least 2, 16:9 ratio recommended)

5. Upload your signed APK file
6. Set up pricing and distribution
7. Submit for review

## Troubleshooting

### Build Errors

- **Gradle version compatibility**: Ensure Gradle version matches the Android Gradle Plugin version
  - Solution: Update Gradle wrapper or Android Gradle Plugin version

- **SDK version issues**: Missing SDK components or incompatible versions
  - Solution: Use SDK Manager to install required components

- **Java version conflicts**: Incompatible Java version
  - Solution: Set JAVA_HOME to point to JDK 17

### Plugin Issues

- **Capacitor plugin compatibility**: Version mismatches between plugins
  - Solution: Ensure all Capacitor plugins are at compatible versions

- **Native plugin errors**: Missing native dependencies
  - Solution: Check plugin documentation for additional requirements

### Permission Issues

- **Runtime permission denials**: User denied critical permissions
  - Solution: Implement proper permission request flows with clear explanations

- **Missing manifest entries**: Required permissions not declared
  - Solution: Verify AndroidManifest.xml has all required permissions

### HMS Integration Issues

- **HMS Core not installed**: App crashes on devices without HMS Core
  - Solution: Implement graceful fallback or prompt user to install HMS Core

- **agconnect-services.json issues**: Configuration file missing or invalid
  - Solution: Verify the file is correctly placed and contains valid configuration

## Updating the App

For future updates:

1. Make changes to your web app
2. Run `npm run build`
3. Run `npx cap copy android`
4. Run `npx cap sync android`
5. Open in Android Studio: `npx cap open android`
6. Increment versionCode and versionName in build.gradle
7. Build a new release version
8. Create a new release in Google Play Console and/or AppGallery Connect
9. Upload the new AAB/APK and submit for review

## Advanced Topics

### App Bundle Optimization

1. Configure dynamic feature modules for large features
2. Set up Play Feature Delivery for on-demand downloads
3. Implement Play Asset Delivery for large assets
4. Configure Play App Signing for optimized APKs

### Performance Optimization

1. Implement startup time optimization
2. Reduce memory usage and prevent leaks
3. Optimize battery usage with efficient background processing
4. Implement efficient image loading and caching

### Security Best Practices

1. Implement certificate pinning for network requests
2. Use Android Keystore for secure key storage
3. Implement proper authentication token handling
4. Protect sensitive data with encryption
5. Implement proper WebView security settings
