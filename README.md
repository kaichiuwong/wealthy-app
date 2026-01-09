# Wealthy - Asset Tracking Dashboard

A comprehensive wealth tracking dashboard visualizing asset distribution across cash, stocks, and crypto over time.

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

3.  Create a `.env` file in the root directory based on `.env.example`:

    ```bash
    cp .env.example .env
    ```

4.  Add your API Key to the `.env` file:

    ```env
    VITE_API_KEY=your_actual_api_key
    ```

### Local Development

Start the development server:

```bash
npm run dev
```

## Deployment on Vercel

This project is configured to be easily deployed on Vercel.

### Option 1: Vercel CLI

1.  Install Vercel CLI: `npm i -g vercel`
2.  Run `vercel` in the project root.
3.  Follow the prompts.
4.  When asked about "Build Settings", the defaults detected for Vite (Output Directory: `dist`) are usually correct.
5.  **Important:** You must set the Environment Variable for the API Key.
    - Go to your Vercel Project Dashboard.
    - Navigate to **Settings** > **Environment Variables**.
    - Add a new variable:
        - **Key**: `VITE_API_KEY`
        - **Value**: `sb_publishable_Uc8KHH8k4un3FXhL-Ef2Tw_o70WwjrR` (or your secret key)
    - Redeploy if necessary.

### Option 2: Git Integration (Recommended)

1.  Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2.  Log in to [Vercel](https://vercel.com).
3.  Click **"Add New..."** > **"Project"**.
4.  Import your Git repository.
5.  Vercel will automatically detect the Vite framework.
6.  Expand the **"Environment Variables"** section.
7.  Add the API key:
    - **Key**: `VITE_API_KEY`
    - **Value**: `sb_publishable_Uc8KHH8k4un3FXhL-Ef2Tw_o70WwjrR`
8.  Click **"Deploy"**.

## Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Language**: TypeScript
