# iOS Build Instructions for eVuka Rewards

## Prerequisites

- macOS computer (required for iOS development)
- Node.js 16 or higher
- Xcode 14 or higher
- CocoaPods installed (`sudo gem install cocoapods`)
- Apple Developer account (paid subscription required for App Store distribution)

## Setup Steps

### 1. Install Capacitor CLI and Core

```bash
npm install @capacitor/cli @capacitor/core
```

### 2. Install Capacitor iOS Platform

```bash
npm install @capacitor/ios
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

### 6. Add iOS Platform

```bash
npx cap add ios
```

### 7. Copy Web Assets to iOS Project

```bash
npx cap copy ios
```

### 8. Update iOS Project with Capacitor Config Changes

```bash
npx cap sync ios
```

### 9. Open the Project in Xcode

```bash
npx cap open ios
```

## Building the App

### 1. Configure App Signing

#### Create App ID in Apple Developer Portal

1. Log in to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to Certificates, IDs & Profiles
3. Select Identifiers and click the + button
4. Register a new App ID with the bundle identifier from your capacitor.config.ts (e.g., "com.evuka.rewards")
5. Enable necessary capabilities (Push Notifications, Associated Domains, etc.)

#### Create Distribution Certificate

1. In the Apple Developer Portal, go to Certificates
2. Click the + button to create a new certificate
3. Select "Apple Distribution" for App Store distribution
4. Follow the instructions to create a Certificate Signing Request (CSR) using Keychain Access
   - Open Keychain Access (Applications > Utilities > Keychain Access)
   - Select Keychain Access > Certificate Assistant > Request a Certificate from a Certificate Authority
   - Enter your email address and common name (your name)
   - Select "Saved to disk" and click Continue
   - Save the CSR file to your desktop
5. Upload the CSR to the Apple Developer Portal
6. Download the certificate and double-click to install it in Keychain Access

#### Create Provisioning Profile

1. In the Apple Developer Portal, go to Profiles
2. Click the + button to create a new profile
3. Select "App Store" distribution
4. Select your App ID
5. Select your distribution certificate
6. Name the profile (e.g., "eVuka Rewards App Store")
7. Download the provisioning profile
8. Double-click the downloaded profile to install it

#### Configure in Xcode

1. In Xcode, select the project in the Project Navigator
2. Select the app target under "Targets"
3. Go to the "Signing & Capabilities" tab
4. Sign in with your Apple Developer account
5. Select your team
6. Ensure "Automatically manage signing" is checked
7. Xcode should automatically select the appropriate provisioning profile

### 2. Configure App Versioning

1. In Xcode, select the project in the Project Navigator
2. Select the app target under "Targets"
3. Go to the "General" tab
4. Set the Version (e.g., "1.0.0") - This is the marketing version shown on the App Store
5. Set the Build number (e.g., "1") - This should be incremented for each build submitted to App Store Connect

### 3. Update App Icons and Splash Screen

1. In Xcode, open `App/App/Assets.xcassets`
2. Replace the placeholder icons in `AppIcon.appiconset` with your app icons
   - Use [App Icon Generator](https://appicon.co/) to create all required sizes
   - Ensure icons don't have alpha channels or transparency
   - Follow [Apple's Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/) for icon design

3. Update splash screen resources in `Splash.imageset`
   - Create splash screen images for multiple scales (1x, 2x, 3x)
   - Follow the configuration in capacitor.config.ts for splash screen settings
   - Consider using a storyboard-based splash screen for more control

### 4. Update App Display Name and Bundle Identifier

1. In Xcode, select the project in the Project Navigator
2. Select the app target under "Targets"
3. Go to the "General" tab
4. Update the "Display Name" to "eVuka Rewards"
5. Verify the "Bundle Identifier" matches your App ID (e.g., "com.evuka.rewards")

### 5. Configure Permissions

Ensure the following entries are in `App/App/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan receipts and barcodes</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to upload receipt images</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>We need permission to save images to your photo library</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need location access to provide store recommendations</string>
```

#### Additional Permission Configurations

1. For App Tracking Transparency (iOS 14.5+):
   ```xml
   <key>NSUserTrackingUsageDescription</key>
   <string>This allows us to provide personalized rewards based on your activity</string>
   ```

2. For Face ID authentication (if used):
   ```xml
   <key>NSFaceIDUsageDescription</key>
   <string>We use Face ID to securely authenticate you to your account</string>
   ```

3. For background location (if needed):
   ```xml
   <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
   <string>We need background location access to notify you of nearby rewards</string>
   <key>NSLocationAlwaysUsageDescription</key>
   <string>We need background location access to notify you of nearby rewards</string>
   ```

### 6. Configure iOS Specific Features

#### App Transport Security

Ensure proper App Transport Security settings in Info.plist:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <!-- Add any exception domains here if needed -->
    </dict>
</dict>
```

#### Universal Links

To support Universal Links (deep linking):

1. Add Associated Domains capability in Xcode
2. Add the following to Info.plist:
   ```xml
   <key>com.apple.developer.associated-domains</key>
   <array>
       <string>applinks:yourdomain.com</string>
   </array>
   ```
3. Create and upload an apple-app-site-association file to your server

#### Push Notifications

To support Push Notifications:

1. Add Push Notifications capability in Xcode
2. Configure APNs in your Apple Developer account
3. Implement proper token registration and notification handling

### 7. Build for Testing

1. In Xcode, select a simulator or connected device
2. Click the "Play" button to build and run the app

### 8. Optimize App Size

Reduce the size of your app:

1. Enable App Thinning in Xcode build settings
2. Use Asset Catalogs for images with appropriate compression
3. Remove unused resources and code
4. Configure bitcode (optional, but recommended)
5. Use On-Demand Resources for content that isn't needed immediately

### 9. Archive for Distribution

1. In Xcode, select "Any iOS Device (arm64)" as the build target
2. Select "Product > Archive" from the menu
3. Once archiving is complete, the Organizer window will open
4. Select your archive and click "Distribute App"
5. Select "App Store Connect" as the distribution method
6. Choose "Upload" to upload to App Store Connect
7. Select your distribution certificate and provisioning profile if prompted
8. Complete the upload process

## Testing

### 1. Test on Simulator

```bash
npx cap run ios
```

### 2. Test on Physical Device

1. Connect your device via USB
2. Select your device in Xcode
3. Click the "Play" button to build and run the app

### 3. Automated Testing

1. Implement UI tests using XCTest:
   - Create test classes in the test target
   - Write tests for critical user flows
   - Run tests on multiple device configurations

2. Implement unit tests for iOS-specific code:
   - Create test classes in the test target
   - Mock dependencies and test isolated components
   - Run tests with Command+U in Xcode

## TestFlight Distribution

1. After uploading your build to App Store Connect, navigate to TestFlight
2. Wait for the build to finish processing (can take 30 minutes to several hours)
3. Once processing is complete, add internal and external testers
   - Internal testers: Up to 100 members of your team with access to App Store Connect
   - External testers: Up to 10,000 users with email invitations or public links

4. For external testers, provide test information:
   - What to test
   - Known issues
   - Contact information for feedback

5. Submit for Beta App Review (required for external testers)
   - This is a lighter review than the full App Store review
   - Usually takes 1-2 days

6. Once approved, testers will receive an email invitation
7. Collect and address feedback from testers

## Preparing for App Store Submission

### 1. Create App Store Listing

1. In App Store Connect, navigate to your app
2. Complete all required metadata:
   - App name (up to 30 characters)
   - Subtitle (up to 30 characters)
   - Description (up to 4000 characters)
   - Keywords (up to 100 characters, comma-separated)
   - Support URL and marketing URL
   - Privacy policy URL (required)

3. Upload App Store screenshots:
   - 6.5" iPhone (required): 1284 x 2778 px
   - 5.5" iPhone (required): 1242 x 2208 px
   - iPad Pro (required if app supports iPad): 2048 x 2732 px
   - Additional sizes as needed

4. Upload App Preview videos (optional but recommended):
   - 15-30 seconds in length
   - No people interacting with device
   - Captured on device or with simulator

### 2. Configure App Information

1. Set up pricing and availability
   - Select price tier
   - Choose availability countries
   - Set availability date

2. Configure in-app purchases (if applicable)
   - Create in-app purchase items
   - Set prices and descriptions
   - Submit for review along with the app

3. Complete the App Privacy section
   - Declare all data types collected
   - Specify how each data type is used
   - Indicate whether data is linked to identity
   - Indicate whether data is used for tracking

4. Set up App Store age rating
   - Complete the age rating questionnaire
   - Be accurate to avoid rejection

### 3. Submit for Review

1. Select the build to submit
2. Complete the "Version Information" section
   - What's new in this version
   - Contact information for review team
   - Notes for the review team

3. Answer the export compliance questions
4. Submit for review
5. Monitor the review status in App Store Connect
6. Be prepared to respond quickly to any reviewer questions

## App Store Review Guidelines

Ensure your app complies with [Apple's App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/):

### 1. Safety

- No objectionable content
- User-generated content must have filtering and reporting mechanisms
- Physical harm prevention (no medical advice without proper credentials)
- Developer information must be accurate and up-to-date
- Apps must have privacy policies and secure data handling

### 2. Performance

- App completeness (no beta, demo, or trial versions)
- Accurate metadata (screenshots, descriptions match functionality)
- Hardware compatibility (clearly state requirements)
- Software requirements (state minimum iOS version)
- No bugs or crashes
- Realistic resource usage (battery, storage, network)

### 3. Business

- Clear in-app purchases
- Subscriptions must follow specific guidelines
- Proper use of Apple's in-app purchase system
- No alternative payment methods for digital goods
- Free apps must provide value without requiring payment

### 4. Design

- Minimal, refined, user-friendly interface
- Follow iOS Human Interface Guidelines
- Proper use of system features and controls
- Appropriate use of notifications
- No replication of App Store functionality

### 5. Legal

- Privacy policy compliance
- Data collection minimization
- Proper handling of user consent
- Intellectual property rights compliance
- No misleading marketing

## Troubleshooting

### Build Errors

- **Code signing issues**: Certificate or provisioning profile problems
  - Solution: Verify certificates in Keychain Access and refresh provisioning profiles

- **CocoaPods errors**: Missing or incompatible pods
  - Solution: Run `pod repo update` and `pod install` to refresh dependencies

- **Xcode version compatibility**: Project requires newer/older Xcode
  - Solution: Update Xcode or adjust project settings for compatibility

### Plugin Issues

- **Capacitor plugin compatibility**: Version mismatches between plugins
  - Solution: Ensure all Capacitor plugins are at compatible versions

- **Native plugin errors**: Missing native dependencies
  - Solution: Check plugin documentation for additional requirements

### Submission Issues

- **App Store Connect upload failures**: Invalid binary
  - Solution: Check for issues with bitcode, architecture, or signing

- **iTunes Connect errors**: Metadata or screenshot issues
  - Solution: Verify all metadata meets Apple's requirements

- **Review rejections**: Guideline violations
  - Solution: Carefully read rejection reason and address specific issues

## Updating the App

For future updates:

1. Make changes to your web app
2. Run `npm run build`
3. Run `npx cap copy ios`
4. Run `npx cap sync ios`
5. Open in Xcode: `npx cap open ios`
6. Increment the build number in Xcode
7. Archive and submit the new version

## Advanced Topics

### App Clips

Implement App Clips for lightweight feature access:

1. Add App Clip target in Xcode
2. Configure App Clip experience in App Store Connect
3. Create App Clip Card for distribution
4. Implement App Clip functionality using the same codebase

### App Extensions

Extend your app's functionality with extensions:

1. Add extension targets in Xcode (Widget, Share, etc.)
2. Implement extension functionality
3. Share data between main app and extensions using App Groups

### Accessibility

Implement comprehensive accessibility support:

1. Add proper accessibility labels and hints
2. Support Dynamic Type for text scaling
3. Ensure proper VoiceOver navigation
4. Test with Accessibility Inspector in Xcode

### Localization

Prepare your app for international markets:

1. Extract all user-facing strings to localization files
2. Configure supported languages in Xcode
3. Provide localized screenshots for App Store
4. Test with different language and region settings

### Privacy Features

Implement privacy-focused features:

1. App Tracking Transparency implementation
2. Privacy nutrition labels accuracy
3. Limited Photos Library usage
4. Secure data storage and transmission
