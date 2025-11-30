# Deployment Guide for Netlify

## Prerequisites

1. ✅ React app is working locally
2. ✅ Django backend is deployed (Railway, Render, Heroku, etc.)
3. ✅ Netlify account (free tier works)

## Step-by-Step Deployment

### Step 1: Prepare Your Code

1. Make sure all changes are committed to git
2. Push to GitHub/GitLab/Bitbucket

### Step 2: Deploy Django Backend First

**Important:** Deploy your Django backend before deploying the frontend.

#### Option A: Railway (Recommended - Free tier available)

1. Go to [Railway](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository and the `task_analyzer` folder
5. Add environment variables if needed
6. Railway will auto-detect Django and deploy
7. Copy your Railway app URL (e.g., `https://your-app.railway.app`)

#### Option B: Render

1. Go to [Render](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repo
4. Set:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python manage.py migrate && python manage.py runserver 0.0.0.0:$PORT`
5. Deploy and copy your Render URL

### Step 3: Update Django CORS Settings

Make sure your Django backend allows requests from Netlify. Update `task_analyzer/task_analyzer/settings.py`:

```python
# Add your Netlify domain (you'll get this after deployment)
CORS_ALLOWED_ORIGINS = [
    "https://your-app.netlify.app",
    "http://localhost:5173",  # For local development
]
```

Or keep `CORS_ALLOW_ALL_ORIGINS = True` for development (not recommended for production).

### Step 4: Deploy to Netlify

#### Method 1: Via Netlify Dashboard (Easiest)

1. **Go to Netlify:**
   - Visit [app.netlify.com](https://app.netlify.com)
   - Sign up/login (free with GitHub)

2. **Import Your Project:**
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub/GitLab/Bitbucket
   - Select your repository
   - Select the `project` folder (or root if repo is just the project)

3. **Configure Build Settings:**
   - **Base directory:** `project` (if your repo has the project in a subfolder)
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

4. **Add Environment Variable:**
   - Go to Site settings → Environment variables
   - Add new variable:
     - **Key:** `VITE_API_BASE_URL`
     - **Value:** `https://your-backend-url.railway.app/api/tasks` (your deployed Django backend URL)
   - Click "Save"

5. **Deploy:**
   - Click "Deploy site"
   - Wait for build to complete (2-3 minutes)

6. **Test:**
   - Visit your Netlify URL (e.g., `https://your-app.netlify.app`)
   - Try adding tasks and analyzing them

#### Method 2: Via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

3. **Navigate to project folder:**
   ```bash
   cd project
   ```

4. **Initialize Netlify:**
   ```bash
   netlify init
   ```
   - Choose "Create & configure a new site"
   - Enter site name (or use auto-generated)
   - Build command: `npm run build`
   - Publish directory: `dist`

5. **Set Environment Variable:**
   ```bash
   netlify env:set VITE_API_BASE_URL "https://your-backend-url.railway.app/api/tasks"
   ```

6. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

### Step 5: Update Custom Domain (Optional)

1. Go to Site settings → Domain management
2. Add your custom domain
3. Follow DNS configuration instructions

## Troubleshooting

### Build Fails

- Check build logs in Netlify dashboard
- Ensure `package.json` has all dependencies
- Verify build command is correct: `npm run build`

### API Calls Fail (CORS Error)

- Check Django CORS settings allow your Netlify domain
- Verify `VITE_API_BASE_URL` environment variable is set correctly
- Check browser console for exact error

### API Calls Fail (404 or Connection Error)

- Verify your Django backend is deployed and running
- Check the backend URL is correct in Netlify environment variables
- Test the backend API directly: `https://your-backend-url.railway.app/api/tasks/analyze/`

### Environment Variables Not Working

- Make sure variable name starts with `VITE_` (required for Vite)
- Redeploy after adding/changing environment variables
- Check variable is set in Netlify dashboard (Site settings → Environment variables)

## Quick Checklist

- [ ] Django backend deployed and accessible
- [ ] CORS configured in Django settings
- [ ] Code pushed to GitHub/GitLab
- [ ] Netlify site created
- [ ] Build settings configured (command: `npm run build`, directory: `dist`)
- [ ] Environment variable `VITE_API_BASE_URL` set with backend URL
- [ ] Site deployed successfully
- [ ] Tested adding tasks and analyzing

## Support

If you encounter issues:
1. Check Netlify build logs
2. Check browser console for errors
3. Verify backend is accessible
4. Test API endpoints directly with Postman/curl

