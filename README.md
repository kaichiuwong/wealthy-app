# Wealthy - Asset Tracking Dashboard

A comprehensive wealth tracking dashboard visualizing asset distribution across cash, stocks, and crypto over time. Secured via local Passkeys (WebAuthn) and email allow-listing.

## Project Setup

This project is built with React and Vite.

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1.  Clone the repository.
2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Create a `.env` file in the root directory:

    ```bash
    cp .env.example .env
    ```

4.  Configure your environment variables in `.env`:

    ```env
    # Supabase/API Key
    VITE_API_KEY=your_actual_api_key

    # Authorized Users (Semicolon separated)
    VITE_ALLOWED_EMAILS=user@example.com;admin@wealthy.app

    # Optional: CoinGecko API Key for crypto rates
    VITE_COINGECKO_API_KEY=your_coingecko_key
    ```

### Local Development

Start the development server:

```bash
npm run dev
```

## Security Features

- **Email Gate**: Access is restricted to emails defined in `VITE_ALLOWED_EMAILS`.
- **Passkey Authentication**: Uses WebAuthn (TouchID, FaceID, Windows Hello) for secure, passwordless login stored locally on the device.

## Deployment on Vercel

This project is configured to be easily deployed on Vercel.

### Option 1: Vercel CLI

1.  Install Vercel CLI: `npm i -g vercel`
2.  Run `vercel` in the project root.
3.  Follow the prompts.
4.  When asked about "Build Settings", the defaults detected for Vite (Output Directory: `dist`) are usually correct.
5.  **Important:** You must set the Environment Variables.
    - Go to your Vercel Project Dashboard.
    - Navigate to **Settings** > **Environment Variables**.
    - Add the following variables:
        - `VITE_API_KEY`: Your Supabase/API key.
        - `VITE_ALLOWED_EMAILS`: Semicolon-separated list of allowed emails (e.g. `chiu0907@gmail.com`).
    - Redeploy if necessary.

### Option 2: Git Integration (Recommended)

1.  Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2.  Log in to [Vercel](https://vercel.com).
3.  Click **"Add New..."** > **"Project"**.
4.  Import your Git repository.
5.  Vercel will automatically detect the Vite framework.
6.  Expand the **"Environment Variables"** section.
7.  Add the required variables:
    - **Key**: `VITE_API_KEY`
    - **Key**: `VITE_ALLOWED_EMAILS` (Value: `chiu0907@gmail.com` or list)
8.  Click **"Deploy"**.

## Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Language**: TypeScript
- **Auth**: WebAuthn (Passkeys)