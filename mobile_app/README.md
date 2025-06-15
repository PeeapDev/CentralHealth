# Hospital FHIR Mobile App

Mobile application for the Hospital FHIR system, built with Flutter and integrated with a Next.js backend.

## Features

- Secure token storage and refresh mechanism
- Role-based access (Patient, Provider, Admin)
- User profile management
- Patient information management
- Appointment scheduling and tracking
- Real-time synchronization with backend

## Setup Requirements

- Flutter SDK (latest stable version)
- Android Studio or Xcode for emulators
- Next.js backend running locally or deployed

## Installation

1. Clone the repository
2. Install dependencies:

```bash
cd mobile_app
flutter pub get
```

## Running the App

### Configure API Endpoint

Before running the app, ensure the backend API endpoint is correctly configured:

1. Start the Next.js backend server (usually at http://localhost:3000)
2. The app will prompt you to set the server URL on first launch, or you can update it in the settings

### Android Emulator Setup

1. Open Android Studio
2. Go to Tools > AVD Manager
3. Create a new virtual device (Pixel 6 recommended with API level 31+)
4. Start the emulator
5. Run the app with:

```bash
flutter run -d android
```

### iOS Simulator Setup

1. Launch Xcode
2. Go to Xcode > Open Developer Tool > Simulator
3. Choose an iOS device (iPhone 14 or newer recommended)
4. Run the app with:

```bash
flutter run -d ios
```

## Permissions

The app requires the following permissions:

- Camera: For taking profile pictures
- Photo Library: For selecting profile pictures
- Internet: For API communication

These permissions are requested at runtime when needed.

## Secure Token Storage

The app uses `flutter_secure_storage` to securely store:

- Access tokens
- Refresh tokens
- Token expiry timestamps
- User data

Tokens are automatically refreshed before expiry to maintain a seamless user experience.

## Troubleshooting

### Common Issues

- **API Connection Issues**: Ensure the backend server is running and the correct URL is configured
- **Token Refresh Failures**: Check server logs for JWT verification errors
- **Profile Image Upload Fails**: Verify camera permissions are granted

### Debug Mode

Run in debug mode for detailed logs:

```bash
flutter run --debug
```

## Development Notes

- API client uses Dio for HTTP requests with automatic token refresh
- State management: Provider pattern with ChangeNotifier
- Secure storage for sensitive data, SharedPreferences for non-sensitive configuration
- Image picking and upload implemented for profile management
