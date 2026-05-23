# Recovery Feast Deployment Plan

This guide explains how to deploy Recovery Feast publicly with:

- Vercel for the React frontend
- Render for the FastAPI backend
- Render Postgres for the production database
- Strava, Yelp, and OpenAI production environment variables

The goal is to deploy the existing app. Do not add new product features during this process.

## Before You Start

You need accounts for:

- GitHub
- Vercel
- Render
- Strava Developer
- Yelp Fusion
- OpenAI

You also need the project pushed to GitHub.

## 1. Deploy The Backend On Render

### Create A Render Web Service

1. Go to Render.
2. Click **New +**.
3. Choose **Web Service**.
4. Connect your GitHub repo.
5. Select the Recovery Feast repo.
6. Use these settings:

```text
Name: recovery-feast-backend
Root Directory: backend
Runtime: Python 3
Python Version: 3.11.9
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

The backend includes `backend/runtime.txt` with:

```text
python-3.11.9
```

This keeps Render on a stable Python version for the current FastAPI, SQLAlchemy, and Pydantic stack.

Do not deploy yet if the environment variables are not ready.

## 2. Create A Postgres Database On Render

1. In Render, click **New +**.
2. Choose **PostgreSQL**.
3. Use a beginner-friendly name:

```text
recovery-feast-db
```

4. Create the database.
5. Copy the database **Internal Database URL**.
6. Add that value to the backend web service as:

```text
DATABASE_URL=<your Render Postgres internal database URL>
```

The backend currently creates tables automatically at startup with SQLAlchemy. That is fine for this beginner deployment. For a more serious production app, add Alembic migrations later.

## 3. Backend Production Environment Variables

In the Render backend web service, add these environment variables:

```text
APP_NAME=AI Recovery & Post-Workout Feast Architect
ENVIRONMENT=production
DATABASE_URL=<Render Postgres Internal Database URL>
APP_BASE_URL=https://your-render-backend-url.onrender.com
FRONTEND_BASE_URL=https://your-vercel-frontend-url.vercel.app

STRAVA_CLIENT_ID=<your Strava client id>
STRAVA_CLIENT_SECRET=<your Strava client secret>
STRAVA_REDIRECT_URI=https://your-render-backend-url.onrender.com/auth/strava/callback

YELP_API_KEY=<your Yelp Fusion API key>

OPENAI_API_KEY=<your OpenAI API key>
OPENAI_MODEL=gpt-4o-mini
```

Important:

- Do not include quotes around values in Render.
- Do not paste local values like `localhost` or `127.0.0.1` into production.
- Do not commit real secrets to GitHub.

## 4. Update Strava Callback URLs

Go to your Strava API settings:

```text
https://www.strava.com/settings/api
```

Use your Render backend domain.

Example:

```text
Website: https://your-render-backend-url.onrender.com
Authorization Callback Domain: your-render-backend-url.onrender.com
```

Then make sure this backend environment variable matches:

```text
STRAVA_REDIRECT_URI=https://your-render-backend-url.onrender.com/auth/strava/callback
```

The callback domain should not include `https://`.
The redirect URI environment variable should include the full `https://.../auth/strava/callback` URL.

## 5. Deploy The Frontend On Vercel

1. Go to Vercel.
2. Click **Add New Project**.
3. Import the GitHub repo.
4. Set the frontend root directory:

```text
frontend
```

5. Use these settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

6. Add this Vercel environment variable:

```text
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

7. Deploy the frontend.

## 6. Connect Frontend And Backend

After Vercel gives you a frontend URL, go back to Render and update:

```text
FRONTEND_BASE_URL=https://your-vercel-frontend-url.vercel.app
```

Then redeploy the Render backend.

This matters because the backend uses `FRONTEND_BASE_URL` for:

- CORS
- redirecting back to the frontend after Strava OAuth succeeds

## 7. Production URL Checklist

Use this pattern:

```text
Backend:
https://your-render-backend-url.onrender.com

Frontend:
https://your-vercel-frontend-url.vercel.app

Strava redirect:
https://your-render-backend-url.onrender.com/auth/strava/callback

Frontend API base URL:
https://your-render-backend-url.onrender.com
```

## 8. Final Production Test Checklist

Test in this order:

```text
[ ] Backend opens at https://your-render-backend-url.onrender.com
[ ] Backend health check opens at https://your-render-backend-url.onrender.com/health
[ ] Frontend opens at https://your-vercel-frontend-url.vercel.app
[ ] Frontend logo loads
[ ] Connect Strava button opens Strava
[ ] Strava redirects back to the Vercel frontend
[ ] Frontend says Strava connected
[ ] Use My Current Location works in the browser
[ ] Cuisine dropdown works
[ ] Generate Recovery Feast calls the Render backend
[ ] Yelp restaurant result appears
[ ] OpenAI meal recommendation appears
[ ] Claim Your Table opens the Yelp business link
```

If something fails:

- Check Render logs first for backend/API errors.
- Check Vercel browser console for frontend/API URL errors.
- Check Strava callback settings if OAuth does not return to the app.
- Check CORS settings if the frontend cannot call the backend.

## Code Changes Required Before Deployment

Already handled:

- Added the Postgres Python driver to `backend/requirements.txt`.
- Added `ENVIRONMENT=production` guidance for Render.
- Gated `GET /debug/users` so it returns 404 in production and does not expose saved Strava users.
- The frontend already reads `VITE_API_BASE_URL`.
- The backend already reads `DATABASE_URL`, `APP_BASE_URL`, `FRONTEND_BASE_URL`, and API keys from environment variables.
- The backend CORS configuration already uses `FRONTEND_BASE_URL`.
- The Strava callback already redirects back to `FRONTEND_BASE_URL`.

Recommended before a real public launch:

- Add Alembic migrations before changing database tables in the future.
- Consider encrypting stored Strava tokens before a serious production launch.
- Add a production logging strategy for Render logs.
- Add a custom domain only after the Render and Vercel URLs work.
