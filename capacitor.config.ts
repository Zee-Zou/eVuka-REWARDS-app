import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.evuka.rewards",
  appName: "eVuka Rewards",
  webDir: "dist",
  server: {
    androidScheme: "https",
    allowNavigation: ["*"],
    hostname: "app", // Custom hostname for better PWA experience
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#4f46e5",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    CapacitorHttp: {
      enabled: true,
    },
    CapacitorCookies: {
      enabled: true,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#4f46e5",
    },
    // Add keyboard configuration for better mobile experience
    Keyboard: {
      resize: true,
      style: "dark",
      resizeOnFullScreen: true,
    },
    // Add status bar configuration
    StatusBar: {
      style: "dark",
      backgroundColor: "#4f46e5",
    },
  },
  android: {
    allowMixedContent: true,
    buildOptions: {
      keystorePath: "android.keystore",
      keystoreAlias: "evuka",
    },
    // Add HarmonyOS configuration
    includePlugins: ["@capacitor/android"],
    // Enable HMS Core integration
    overrideUserAgent: "eVukaRewards-Android",
    backgroundColor: "#4f46e5",
    // Add additional configuration for Android 12+
    minSdkVersion: 22,
    targetSdkVersion: 33,
  },
  ios: {
    contentInset: "automatic",
    scheme: "eVukaRewards",
    preferredContentMode: "mobile",
    // Add additional iOS configuration
    backgroundColor: "#4f46e5",
    // Enable App Tracking Transparency
    infoPlist: {
      NSCameraUsageDescription:
        "We need camera access to scan receipts and barcodes",
      NSPhotoLibraryUsageDescription:
        "We need photo library access to upload receipt images",
      NSPhotoLibraryAddUsageDescription:
        "We need permission to save images to your photo library",
      NSLocationWhenInUseUsageDescription:
        "We need location access to provide store recommendations",
      NSUserTrackingUsageDescription:
        "This allows us to provide personalized rewards based on your activity",
      ITSAppUsesNonExemptEncryption: false,
      CFBundleShortVersionString: "1.0.0",
      CFBundleVersion: "1",
    },
    // Enable Universal Links
    limitsNavigationsToAppBoundDomains: true,
  },
  // Add HarmonyOS configuration
  harmonyos: {
    enabled: true,
    // HMS Core configuration
    hmsCore: true,
  },
};

export default config;
