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

## 4. File uploads now use MongoDB GridFS

Uploaded bytes are stored in MongoDB (bucket `rootle_files`), not on Vercel's read-only filesystem. `Resource.file_url` now looks like `/api/resources/file/<id>`, served by `GET /api/resources/file/:id` (`server/controllers/resourceController.js`). Multer uses memory storage (`server/middleware/upload.js`), and the frontend resolves all file URLs through `resolveFileUrl()` in `Client/src/config.js`.

If you have existing files in `server/uploads`, run the one-off migration **locally** (where those files exist):

```bash
cd server
npm run migrate:gridfs
```

It uploads each file to GridFS and rewrites the matching `Resource.file_url`. It leaves the original files in place as a backup; delete them only after you verify previews/downloads.

Remaining platform limit: Vercel Hobby rejects request bodies above ~4.5 MB before the function runs. GridFS fixes persistence, not that gateway limit. For larger files, upgrade Vercel or switch to direct-to-storage uploads (Cloudinary/S3 signed uploads).
