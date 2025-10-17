# eVuka Rewards App

## Overview

The eVuka Rewards app is a modern, gamified platform that allows users to earn points and rewards by capturing receipts. The app features a sophisticated receipt capture system with multiple submission methods, real-time feedback, and engaging reward animations.

## Features

### Receipt Capture

- **Multi-method Capture**: Submit receipts via camera, QR code scanning, manual entry, or email/accounts.
- **AI-enhanced Capture**: Real-time quality feedback and image enhancement
- **AR Scanner**: Advanced receipt scanning with augmented reality features
- **Duplicate Detection**: Smart detection of previously submitted receipts

### Rewards System

- **Points System**: Earn points for each receipt submission
- **Daily Goals**: Track progress toward daily point targets
- **Streaks**: Maintain daily submission streaks for bonus rewards
- **Level Progression**: Level up as you accumulate points
- **Bonus Multipliers**: Earn extra points with multipliers

### User Experience

- **Animated Success States**: Engaging animations and confetti effects when points are earned
- **Visual Progress Indicators**: Clear display of goals and achievements
- **Responsive Design**: Optimized for both desktop and mobile devices

## Tech Stack

- **Frontend**: React with TypeScript and Vite
- **UI Components**: ShadCN UI components with Radix UI primitives
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Database**: Supabase
- **Image Processing**: Tesseract.js for OCR
- **Testing**: Jest and React Testing Library

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/evuka-rewards.git
cd evuka-rewards

# Install dependencies
npm install

# Set up environment variables
# Create a .env file with the following variables:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Start the development server
npm run dev
```

### Environment Variables

The app requires the following environment variables:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Project Structure

```
src/
├── components/         # UI components
│   ├── auth/           # Authentication components
│   ├── gamification/   # Gamification features
│   ├── receipt-capture/ # Receipt capture functionality
│   ├── rewards/        # Rewards marketplace
│   ├── shopping/       # Shopping lists and recommendations
│   ├── social/         # Social features and sharing
│   └── ui/             # Base UI components
├── lib/                # Utility functions and services
├── pages/              # Page components
├── providers/          # Context providers
└── types/              # TypeScript type definitions
```

## Key Components

### Receipt Capture

- **CaptureInterface**: Main interface for receipt submission
- **CameraView**: Camera interface for capturing receipts
- **CaptureMethods**: Selection of different capture methods
- **PointsDisplay**: Shows current points and progress
- **SuccessOverlay**: Animated overlay shown after successful submission

## Development

### Running Tests

```bash
npm run test
```

### Building for Production

```bash
npm run build
```

## Mobile Testing

To test the app on mobile devices:

1. **Using the development server**:
   - Ensure your computer and mobile device are on the same network
   - Use the network IP address instead of localhost (e.g., http://192.168.1.100:5173)

2. **Using Chrome DevTools**:
   - Open Chrome DevTools (F12)
   - Toggle the device toolbar (Ctrl+Shift+M)
   - Select a mobile device from the dropdown

3. **Using a tunnel service**:
   - Install ngrok: `npm install -g ngrok`
   - Start your dev server: `npm run dev`
   - Create a tunnel: `ngrok http 5173`
   - Use the provided URL on your mobile device

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
