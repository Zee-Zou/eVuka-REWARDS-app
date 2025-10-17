# App Store Deployment Guide for eVuka Rewards

This guide provides detailed instructions for deploying the eVuka Rewards app to multiple app stores:

- Google Play Store (Android)
- Apple App Store (iOS)
- Huawei AppGallery (HarmonyOS/Android)

## General Preparation Checklist

- [ ] App is fully tested and all critical bugs are fixed
- [ ] Privacy policy is created and accessible via a public URL
- [ ] Terms of service document is created and accessible via a public URL
- [ ] App icon sets are prepared for all platforms
- [ ] Screenshots are captured for all required device sizes
- [ ] App description, keywords, and promotional text are prepared
- [ ] Release notes/what's new text is prepared
- [ ] Contact information for store listings is ready
- [ ] All in-app purchases are configured and tested
- [ ] Age rating assessment information is prepared
- [ ] Data safety/privacy labels information is prepared
- [ ] App accessibility features are documented

## Platform-Specific Requirements

### Google Play Store (Android)

#### Required Metadata

- **App Title**: Limited to 50 characters
- **Short Description**: Limited to 80 characters
- **Full Description**: Limited to 4000 characters
- **App Category**: Primary and secondary (optional) categories
- **Content Rating**: Complete the rating questionnaire
- **Contact Details**: Email address, phone number, website
- **Privacy Policy URL**: Must be a valid URL

#### Required Graphics

- **App Icon**: 512 x 512 px PNG (32-bit)
- **Feature Graphic**: 1024 x 500 px JPG or PNG (24-bit)
- **Screenshots**: 
  - Phone: At least 2 screenshots (16:9 aspect ratio recommended)
  - Tablet: At least 2 screenshots (if app supports tablets)
  - TV: At least 1 screenshot (if app supports Android TV)
  - Wear OS: At least 1 screenshot (if app supports Wear OS)
- **Promo Video**: YouTube URL (optional)

#### Advanced Google Play Requirements

- **App Bundle**: Google Play requires Android App Bundle (.aab) format instead of APK
- **Target API Level**: Must target Android API level 33 (Android 13) or higher
- **64-bit Support**: Apps must include 64-bit libraries in addition to 32-bit libraries
- **App Signing**: Use Google Play App Signing for enhanced security
- **Data Safety Section**: Detailed declaration of all data collection practices
- **In-App Purchases**: Must be processed through Google Play Billing
- **Content Restrictions**: No gambling content without proper licensing
- **Accessibility Services**: Proper implementation if using accessibility services
- **Background Location**: Justification required for background location access
- **SMS/Call Log Permissions**: Special permission required if accessing these

#### Google Play Store Policies to Consider

- **Deceptive Behavior**: No misleading users about app functionality
- **Intellectual Property**: No trademark or copyright infringement
- **User-Generated Content**: Must have moderation and reporting system
- **Minimum Functionality**: App must provide a basic level of functionality
- **Ads**: Must follow Google Play's ad policies
- **Payments**: Must use Google Play's billing system for digital goods
- **Family Policies**: Additional requirements if targeting children

#### Submission Process

1. Sign in to [Google Play Console](https://play.google.com/console)
2. Create a new app or select existing app
3. Complete store listing information
4. Set up content rating
5. Set pricing and distribution
6. Upload APK or App Bundle (.aab file)
7. Review and submit for approval

### Apple App Store (iOS)

#### Required Metadata

- **App Name**: Limited to 30 characters
- **Subtitle**: Limited to 30 characters
- **Description**: Limited to 4000 characters
- **Keywords**: Limited to 100 characters (comma-separated)
- **Support URL**: Must be a valid URL
- **Marketing URL**: Optional but recommended
- **Privacy Policy URL**: Must be a valid URL
- **App Category**: Primary and secondary (optional) categories
- **Content Rating**: Complete the rating questionnaire
- **Contact Information**: First name, last name, phone number, email

#### Required Graphics

- **App Icon**: 1024 x 1024 px PNG (without alpha channel)
- **Screenshots**:
  - iPhone: At least 3 screenshots for each supported device size
  - iPad: At least 3 screenshots (if app supports iPad)
  - Apple Watch: At least 1 screenshot (if app supports Apple Watch)
  - Apple TV: At least 1 screenshot (if app supports Apple TV)
- **App Preview Videos**: Optional but recommended (up to 30 seconds)

#### Advanced Apple App Store Requirements

- **App Privacy**: Detailed privacy labels in App Store Connect
- **App Tracking Transparency**: Implementation required for user tracking
- **Sign in with Apple**: Required if app offers third-party sign-in options
- **IPv6 Support**: App must work in IPv6-only networks
- **App Transport Security (ATS)**: HTTPS connections required
- **Device Compatibility**: Must support iPhone and iPod Touch with iOS 14.0+
- **64-bit Support**: Apps must be 64-bit compatible
- **App Size**: Initial download size should be less than 200MB
- **Notifications**: Must request permission before sending notifications
- **In-App Purchases**: Must use Apple's in-app purchase system

#### Apple App Store Review Guidelines to Consider

- **Safety**: No objectionable content, accurate metadata
- **Performance**: App completeness, stable functionality
- **Business**: Appropriate business model, clear subscription terms
- **Design**: User interface that follows iOS design principles
- **Legal**: Privacy policy compliance, intellectual property rights
- **Data Collection**: Minimization and user consent for data collection
- **Hardware Compatibility**: Proper use of device capabilities
- **Software Requirements**: Compliance with latest iOS requirements
- **Web Content**: Web content must be contained in the binary
- **Mobile Device Management**: Special approval required for MDM apps

#### Submission Process

1. Sign in to [App Store Connect](https://appstoreconnect.apple.com)
2. Create a new app or select existing app
3. Complete app information and store listing
4. Upload build using Xcode or Transporter
5. Submit for review
6. Respond to any reviewer questions promptly

### Huawei AppGallery (HarmonyOS)

#### Required Metadata

- **App Name**: Limited to 64 characters
- **App Description**: Limited to 8000 characters
- **App Category**: Select appropriate category
- **Content Rating**: Complete the rating questionnaire
- **Privacy Policy URL**: Must be a valid URL
- **Service Region**: Select countries where the app will be available
- **Developer Information**: Company name, website, email address

#### Required Graphics

- **App Icon**: 1024 x 1024 px PNG
- **Feature Graphic**: 1080 x 720 px JPG or PNG
- **Screenshots**: At least 2 screenshots (16:9 aspect ratio recommended)
- **Promo Video**: URL (optional)

#### Advanced Huawei AppGallery Requirements

- **HMS Core Integration**: Replace Google services with Huawei Mobile Services
- **HMS Account Kit**: For user authentication (replacing Google Sign-In)
- **HMS Push Kit**: For push notifications (replacing Firebase Cloud Messaging)
- **HMS Map Kit**: For maps functionality (replacing Google Maps)
- **HMS Analytics Kit**: For app analytics (replacing Google Analytics)
- **HMS Ads Kit**: For monetization (replacing Google AdMob)
- **HMS In-App Purchases**: For digital goods (replacing Google Play Billing)
- **AppGallery Connect**: For app management and services
- **Quick App Support**: Optional lightweight app version
- **HarmonyOS Support**: Optimizations for HarmonyOS devices

#### Huawei AppGallery Policies to Consider

- **Content Restrictions**: No illegal or inappropriate content
- **User Privacy**: Clear privacy policy and data handling practices
- **Intellectual Property**: No trademark or copyright infringement
- **App Quality**: Stable performance, no crashes or ANRs
- **App Security**: Secure data transmission and storage
- **Advertising**: Appropriate ad content and placement
- **In-App Purchases**: Must use HMS IAP for digital goods
- **Regional Compliance**: Adherence to local laws and regulations
- **App Functionality**: App must provide value to users
- **User Experience**: Intuitive interface and navigation

#### Submission Process

1. Sign in to [AppGallery Connect](https://developer.huawei.com/consumer/en/service/josp/agc/index.html)
2. Create a new app or select existing app
3. Complete app information and store listing
4. Upload APK file
5. Submit for review
6. Monitor review status and respond to any issues

## Post-Submission Checklist

- [ ] Monitor review status on all platforms
- [ ] Respond promptly to any reviewer questions or concerns
- [ ] Prepare marketing materials for app launch
- [ ] Set up app analytics to track installations and usage
- [ ] Configure crash reporting and monitoring
- [ ] Set up user feedback channels
- [ ] Plan for regular updates and maintenance
- [ ] Monitor app ratings and reviews
- [ ] Prepare for post-launch support
- [ ] Set up A/B testing for feature optimization
- [ ] Implement user retention strategies
- [ ] Plan for localization to additional markets

## Troubleshooting Common Issues

### Google Play Store

- **Rejection due to metadata issues**: Ensure all text and images comply with Google Play policies
- **Crash reports**: Address any crashes reported during review
- **Permission issues**: Justify all requested permissions in the app description
- **Data safety section issues**: Ensure accurate declaration of data collection practices
- **Target API level requirements**: Ensure the app targets the required Android API level
- **App bundle requirements**: Make sure you're using Android App Bundle format (.aab)
- **64-bit support**: Ensure your app includes 64-bit libraries
- **Billing issues**: Verify in-app purchases are implemented correctly
- **Policy violations**: Review the specific policy violation and address it
- **Deceptive behavior flags**: Ensure app functionality matches description

### Apple App Store

- **Guideline violations**: Carefully review Apple's App Store Review Guidelines
- **Metadata rejection**: Ensure screenshots accurately represent the app
- **In-app purchases**: Verify all in-app purchases are properly configured
- **Privacy labels**: Ensure App Privacy details are accurately completed
- **Sign-in requirements**: If your app uses account creation, ensure Sign in with Apple is implemented
- **App tracking transparency**: Implement proper ATT dialogs if tracking users
- **Crash during review**: Test thoroughly on all supported iOS versions
- **Performance issues**: Optimize app performance, especially on older devices
- **Incomplete information**: Provide all requested information to reviewers
- **Copycat concerns**: Ensure your app offers unique value and isn't too similar to existing apps

### Huawei AppGallery

- **HMS Core integration issues**: Ensure proper implementation of HMS Core services
- **Content compliance**: Review content for compliance with local regulations
- **Performance issues**: Optimize app performance on Huawei devices
- **APK validation failures**: Verify APK is properly signed and formatted
- **Service region restrictions**: Ensure compliance with regional requirements
- **Privacy policy issues**: Verify privacy policy meets Huawei's requirements
- **HMS capability issues**: Test all HMS replacements for Google services
- **App adaptation problems**: Ensure proper adaptation for different screen sizes
- **Quick App compatibility**: Address any issues with Quick App version if implemented
- **HarmonyOS optimization**: Test specifically on HarmonyOS devices

## Resources

- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Google Play Developer Policy Center](https://play.google.com/about/developer-content-policy/)
- [Google Play App Signing](https://developer.android.com/studio/publish/app-signing#app-signing-google-play)
- [Google Play Data Safety Section](https://support.google.com/googleplay/android-developer/answer/10787469)

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [App Store Submission Tips](https://developer.apple.com/app-store/submissions/)
- [App Privacy Details on the App Store](https://developer.apple.com/app-store/app-privacy-details/)

- [Huawei AppGallery Documentation](https://developer.huawei.com/consumer/en/doc/development/AppGallery-connect-Guides/agc-get-started)
- [HMS Core Documentation](https://developer.huawei.com/consumer/en/doc/development/HMSCore-Guides/introduction-0000001050040471)
- [AppGallery Connect Console](https://developer.huawei.com/consumer/en/service/josp/agc/index.html)
- [HarmonyOS Documentation](https://developer.harmonyos.com/en/documentation/)

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Android Platform](https://capacitorjs.com/docs/android)
- [Capacitor iOS Platform](https://capacitorjs.com/docs/ios)
