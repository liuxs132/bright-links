# Bright Links

Daily word grouping game (static frontend) with email capture.

## Local

Serve the folder with any static server (for example `python -m http.server`).

Note: the `/api/subscribe` endpoint only exists when deployed on Vercel (or when using the Vercel dev server).

## Deploy (Vercel)

1. Import this folder as a Vercel project.
2. In Vercel Project Settings -> Environment Variables, add:
   - `CONVERTKIT_FORM_ID`
   - `CONVERTKIT_API_KEY`
3. Deploy.

The signup box posts to `/api/subscribe` which forwards to ConvertKit.
