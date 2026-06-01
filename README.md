# Project Lookahead Mobile

A professional construction project management mobile application built with Expo, React Native, and TypeScript.

## Features

- **Authentication**: Secure login screen for users.
- **Project Management**: List of active construction projects with quick status views.
- **Today Dashboard**: Project-specific daily overview of tasks and milestones.
- **Scheduling**: View project schedules and task timelines.
- **Daily Logs**: Digital logbooks for tracking site activity and authors.
- **Open Items**: Track and prioritize unresolved project issues.
- **Documents**: Placeholder for integrated document management (Blueprints, RFIs).
- **Settings**: User preferences and application settings.

## Tech Stack

- **Framework**: Expo (Managed Workflow)
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **Styling**: StyleSheet (React Native)

## Getting Started

### Prerequisites

- Node.js (LTS)
- Expo Go app on your mobile device (or an emulator)

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd project-lookahead-mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

1. Start the Expo development server:
   ```bash
   npm start
   ```

2. Scan the QR code with your Expo Go app or press `i` for iOS simulator / `a` for Android emulator.

## Project Structure

- `src/components`: Reusable UI components (Card, Button, Input).
- `src/screens`: Main application screen views.
- `src/navigation`: Navigation configuration and routing.
- `src/types`: TypeScript interfaces for project data.
- `src/constants`: App-wide constants and theme colors.
- `src/services`: Data fetching and API logic.
