# Host Meals on Vercel (frontend + backend)

Follow these steps to get your app live on Vercel.

---

## Step 1: Push your code

Make sure your latest code is on GitHub (e.g. **Gamage-Recruiters/Meals**, `main` branch).

---

## Step 2: Create a Vercel project

1. Go to **https://vercel.com** and sign in (use **GitHub**).
2. Click **Add New…** → **Project**.
3. Find the **Meals** repo and click **Import**.
4. On the import screen:
   - **Root Directory:** leave as **.** (repo root). Do **not** change it to `frontend`.
   - **Framework Preset:** leave as **Other** (or **Vite** if shown; the repo’s `vercel.json` controls the build).
   - Do **not** click Deploy yet — add env vars first.

---

## Step 3: Add environment variables

Before deploying, add your env vars so the backend and frontend work in production.

1. On the same import screen (or after creating the project), open **Environment Variables**.
2. Add these **one by one** (name + value, then Add):

| Name | Value | Required? |
|------|--------|------------|
| `MONGODB_URI` | Your MongoDB connection string (e.g. from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)) | **Yes** |
| `CLERK_SECRET_KEY` | From [Clerk Dashboard](https://dashboard.clerk.com) → API Keys | **Yes** (for auth) |
| `VITE_API_BASE_URL` | Leave **empty** | Yes (empty = same domain) |
| `CORS_ORIGIN` | For first deploy use `*`; after deploy set to your app URL, e.g. `https://meals-xxx.vercel.app` | Recommended |

**Optional** (only if you use these features):

| Name | Value |
|------|--------|
| `RESEND_API_KEY` | From [Resend](https://resend.com) (emails) |
| `RESEND_FROM` | Sender email for Resend (e.g. `noreply@yourdomain.com`) |
| `OTP_SECRET` | A random secret string for OTP (e.g. generate one) |
| `ADMIN_SEED_TOKEN` | Secret token for admin sign-up in production |
| `OPENAI_API_KEY` | If you use AI insights |
| `SENTRY_DSN` | If you use Sentry for errors |
| `LOG_LEVEL` | e.g. `info` or `debug` |

3. Apply env vars to **Production** (and optionally Preview).
4. Click **Deploy**.

---

## Step 4: Wait for the build

Vercel will:

- Install dependencies for `frontend` and `backend`
- Build the frontend (Vite) into `frontend/dist`
- Set up the API so `/api/*` is handled by your Express backend

Build usually takes 1–3 minutes. If it fails, open the **Build Logs** and fix the reported error.

---

## Step 5: Fix CORS after first deploy (recommended)

1. After the first successful deploy, copy your app URL (e.g. `https://meals-abc123.vercel.app`).
2. In Vercel: **Project** → **Settings** → **Environment Variables**.
3. Edit `CORS_ORIGIN` and set it to that URL (or add it if you used `*` at first).
4. Redeploy: **Deployments** → **…** on latest → **Redeploy**.

---

## Step 6: Connect frontend to Clerk (if you use Clerk)

1. In [Clerk Dashboard](https://dashboard.clerk.com), open your application.
2. Go to **Configure** → **Domains** (or **Paths**).
3. Add your Vercel domain, e.g. `meals-abc123.vercel.app` (and any custom domain later).
4. Ensure the frontend env has the right Clerk keys (e.g. `VITE_CLERK_PUBLISHABLE_KEY` if your frontend uses it; add it in Vercel env vars).

---

## Your live URLs

- **App (frontend):** `https://<your-project>.vercel.app`
- **API (backend):** `https://<your-project>.vercel.app/api/v1/...`  
  Example health check: `https://<your-project>.vercel.app/api/v1/health`

With `VITE_API_BASE_URL` empty, the frontend automatically calls the API on the same domain.

---

## Troubleshooting

| Problem | What to do |
|--------|------------|
| Build fails on “npm run install:all” | Ensure root `package.json` exists and has the `install:all` script. |
| Build fails in frontend | Check **Build Logs**; fix any missing env vars or dependency errors. |
| API returns 500 or “DB_ERROR” | Set `MONGODB_URI` in Vercel and redeploy. |
| API returns 401 on auth | Set `CLERK_SECRET_KEY` and add your Vercel domain in Clerk. |
| CORS errors in browser | Set `CORS_ORIGIN` to your exact Vercel URL (or `*` for testing). |

---

## Summary checklist

- [ ] Code pushed to GitHub  
- [ ] Vercel project created from repo, **root directory = .**  
- [ ] `MONGODB_URI` and `CLERK_SECRET_KEY` set  
- [ ] `VITE_API_BASE_URL` set to empty  
- [ ] `CORS_ORIGIN` set (`*` first, then your Vercel URL)  
- [ ] Deploy triggered and build succeeded  
- [ ] Vercel domain added in Clerk (if using Clerk)  
- [ ] Visit `https://<your-project>.vercel.app` and test login + API  
