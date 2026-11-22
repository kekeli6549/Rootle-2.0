// Single source of truth for the backend origin.
// Set VITE_API_URL in Vercel (Project Settings -> Environment Variables)
// to the production URL of the "server" deployment, e.g.
// https://your-server-project.vercel.app
//
// The fallback keeps local development working and matches the last known
// deployed backend hostname. Do NOT include a trailing slash.
export const BACKEND_URL = (import.meta.env.VITE_API_URL || 'https://rootle-2-0-gps6-eowdtgqtp-lord-frostbytes-projects-d5e710e2.vercel.app').replace(/\/+$/, '');

// All server routes are mounted under /api (see server/index.js).
export const API_URL = `${BACKEND_URL}/api`;

export default BACKEND_URL;
