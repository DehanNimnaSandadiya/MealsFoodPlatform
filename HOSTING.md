# Host Meals: Frontend on Vercel + Backend on Render

This guide gets your app live with:
- **Frontend** (Vite/React) → [Vercel](https://vercel.com)
- **Backend** (Node/Express) → [Render](https://render.com)

---

## Part 1: Deploy the backend on Render first

You need the backend URL before configuring the frontend.

### 1.1 Create a Render account and project

1. Go to **https://render.com** and sign up (or log in).
2. Click **New +** → **Web Service**.
3. Connect your GitHub and select the repo **DehanNimnaSandadiya/MealsFoodPlatform** (or your fork).
4. Configure the service:
   - **Name:** `meals-backend` (or any name).
   - **Region:** Choose closest to your users.
   - **Branch:** `main`.
   - **Root Directory:** `backend` (important).
   - **Runtime:** `Node`.
   - **Build Command:** `npm install`.
   - **Start Command:** `npm start`.

### 1.2 Environment variables on Render

In the same screen (or **Environment** after creation), add:

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `CLERK_SECRET_KEY` | From [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `CORS_ORIGIN` | Leave empty for now; set after you have the Vercel URL (e.g. `https://your-app.vercel.app`) |

**Optional** (if you use them):

| Key | Value |
|-----|--------|
| `RESEND_API_KEY` | Resend API key (emails) |
| `RESEND_FROM` | Sender email |
| `OTP_SECRET` | Random secret for OTP |
| `ADMIN_SEED_TOKEN` | Admin sign-up token |
| `OPENAI_API_KEY` | For AI insights |
| `SENTRY_DSN` | Sentry error tracking |
| `LOG_LEVEL` | `info` or `debug` |

### 1.3 Deploy the backend

1. Click **Create Web Service**.
2. Wait for the first deploy (a few minutes). Fix any build/start errors from the logs.
3. Copy your backend URL, e.g. **`https://meals-backend-xxxx.onrender.com`**. You will use this for the frontend and for `CORS_ORIGIN` later.

### 1.4 Set CORS after you have the frontend URL

After Part 2 (Vercel), come back to Render:

- **Environment** → Edit `CORS_ORIGIN` → set it to your Vercel app URL (e.g. `https://meals-food-platform.vercel.app`).
- Save; Render will redeploy automatically.

---

## Part 2: Deploy the frontend on Vercel

### 2.1 Create a Vercel project

1. Go to **https://vercel.com** and sign in with GitHub.
2. Click **Add New…** → **Project**.
3. Import the repo **DehanNimnaSandadiya/MealsFoodPlatform**.
4. On the import screen:
   - **Root Directory:** leave as **.** (repo root). Do **not** set it to `frontend`.
   - **Framework Preset:** Vite (or Other; `vercel.json` controls the build).
   - Do **not** deploy yet — add env vars first.

### 2.2 Environment variables on Vercel

Add one variable (required):

| Name | Value |
|------|--------|
| `VITE_API_BASE_URL` | Your **Render backend URL** from Part 1, e.g. `https://meals-backend-xxxx.onrender.com` |

No trailing slash. The frontend will call `VITE_API_BASE_URL + /api/v1/...`.

Add any **Clerk** keys if your frontend uses them (e.g. `VITE_CLERK_PUBLISHABLE_KEY`).

### 2.3 Deploy the frontend

1. Click **Deploy**.
2. Wait for the build. It runs `cd frontend && npm install && npm run build` and serves `frontend/dist`.
3. Copy your frontend URL, e.g. **`https://meals-food-platform.vercel.app`**.

### 2.4 Connect frontend and backend

1. **Render** → your backend service → **Environment** → set `CORS_ORIGIN` to your **Vercel URL** (e.g. `https://meals-food-platform.vercel.app`). Save.
2. **Clerk Dashboard** → your app → **Domains** → add your **Vercel domain** (e.g. `meals-food-platform.vercel.app`).

---

## Summary

| What | Where | URL example |
|------|--------|-------------|
| Frontend | Vercel | `https://your-project.vercel.app` |
| Backend API | Render | `https://meals-backend-xxxx.onrender.com` |

**Flow:** User opens Vercel URL → frontend loads → frontend calls Render URL for `/api/v1/...`.

---

## Checklist

- [ ] Backend deployed on Render; **Root Directory** = `backend`, **Start** = `npm start`.
- [ ] `MONGODB_URI` and `CLERK_SECRET_KEY` set on Render.
- [ ] Backend URL copied (e.g. `https://meals-backend-xxxx.onrender.com`).
- [ ] Frontend deployed on Vercel; **Root Directory** = `.` (repo root).
- [ ] `VITE_API_BASE_URL` on Vercel = backend URL (no trailing slash).
- [ ] `CORS_ORIGIN` on Render = Vercel app URL.
- [ ] Vercel domain added in Clerk Dashboard.
- [ ] Test: open Vercel URL, sign in, use the app.

---

## Troubleshooting

| Issue | What to do |
|--------|------------|
| Build fails on Vercel | Check **Build Logs**; ensure Root Directory is `.` and `vercel.json` is at repo root. |
| Build fails on Render | Ensure **Root Directory** is `backend` and **Start Command** is `npm start`. Check **Logs** for missing env vars. |
| “Network error” or API 404 in browser | Confirm `VITE_API_BASE_URL` on Vercel is exactly the Render URL (no trailing slash). |
| CORS errors | Set `CORS_ORIGIN` on Render to your exact Vercel URL (with `https://`). |
| 401 on login | Set `CLERK_SECRET_KEY` on Render and add Vercel domain in Clerk. |
