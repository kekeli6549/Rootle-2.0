# Rootle 2.0 — Vercel deployment checklist

The code is fixed. These are the **Vercel dashboard settings** that must also be correct — code alone cannot fix them.

## 1. Turn OFF Deployment Protection on BOTH projects

Both deployed URLs currently redirect to `vercel.com/login` for anyone who is not signed in to Vercel. That means the browser gets Vercel's login HTML instead of your React app / API, so login and register can never work.

For **each** project (Client and server):

`Settings → Deployment Protection → Vercel Authentication → Off`

(Alternatively use "Standard Protection" and add the other project's domain as an exception, but Off is simplest for a public school project.)

Redeploy both projects afterwards.

## 2. Environment variables

### server project (`rootle-2-0-gps6`)

`Settings → Environment Variables` — add for Production, Preview and Development:

| Name | Value |
| --- | --- |
| `MONGO_URI` | your MongoDB Atlas connection string |
| `JWT_SECRET` | a long, random secret (replace the weak default) |
| `CLIENT_URL` | the exact Frontend origin, e.g. `https://rootle-2-0-6p7mxd9cu-...vercel.app` (no trailing slash) |
| `SUPERADMIN_PASSWORD` | strong password for the seeded super admin |

### Client project (`rootle-2-0-6p7mxd9cu`)

| Name | Value |
| --- | --- |
| `VITE_API_URL` | the backend **origin only**, e.g. `https://rootle-2-0-gps6-...vercel.app` — no `/api`, no trailing slash |

> Get the exact backend origin from the server project's `Settings → Domains` or from the deployment URL shown after a successful deploy. The URL previously hard-coded in the source was an old deployment hash.

Redeploy both projects after adding/changing variables. Vite bakes `VITE_*` variables into the build, so the Client **must be rebuilt**.

## 3. Root Directory / build settings

Both projects were deployed as separate apps from the same repo, so set:

- Client project: **Root Directory** = `Client` (Framework: Vite)
- server project: **Root Directory** = `server` (Framework: Other / Node)

`Client/vercel.json` adds the SPA fallback so `/login`, `/register`, `/dashboard/...` work on refresh.
`server/vercel.json` routes all requests to the exported Express app (`@vercel/node`).

## 4. Known serverless limitation: file uploads

Vercel serverless functions have a read-only filesystem (except `/tmp`), a 4.5 MB request body limit, and no guarantee that `/tmp` survives between invocations. Uploads are written to `/tmp` so the API no longer crashes, but files may disappear and large uploads will fail.

For production-grade storage, move uploads to Cloudinary / S3 / MongoDB GridFS and store the resulting public URL in `Resource.file_url`. The rest of the app already treats `file_url` as a relative path under the backend origin, so that change is isolated to `server/middleware/upload.js` and `server/controllers/resourceController.js`.
