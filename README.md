# Smart Task Analyzer - React Frontend

A modern React + TypeScript frontend for the Smart Task Analyzer application.

## Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update the `.env` file with your API URL:
```
VITE_API_BASE_URL=http://127.0.0.1:8000/api/tasks
```

4. Start the development server:
```bash
npm run dev
```

## Building for Production

```bash
npm run build
```

The build output will be in the `dist` folder.

## Deployment to Netlify

### Option 1: Deploy via Netlify CLI

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Login to Netlify:
```bash
netlify login
```

3. Initialize and deploy:
```bash
netlify init
netlify deploy --prod
```

### Option 2: Deploy via Netlify Dashboard

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Netlify](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Add environment variable:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** Your deployed Django backend URL (e.g., `https://your-backend.railway.app/api/tasks`)
7. Click "Deploy site"

## Environment Variables

- `VITE_API_BASE_URL`: The base URL for the Django backend API

**Important:** Make sure your Django backend is deployed and CORS is configured to allow requests from your Netlify domain.

## Backend Deployment

The Django backend needs to be deployed separately. Options include:
- Railway (recommended)
- Render
- Heroku
- DigitalOcean App Platform
- AWS/GCP/Azure

After deploying the backend, update the `VITE_API_BASE_URL` environment variable in Netlify with your backend URL.

