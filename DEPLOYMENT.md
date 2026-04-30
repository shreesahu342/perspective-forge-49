# Deployment

## UI on Vercel

Files added:

- `.github/workflows/deploy-vercel-ui.yml`
- `vercel.json`

Required GitHub secret:

- `VERCEL_TOKEN`

Required GitHub variables:

- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Required Vercel project environment variables:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_BACKEND_URL`

The Vercel build uses Nitro through `npm run build:vercel` and serves the TanStack Start app with server routes intact.

## AI Space on Hugging Face

Files added:

- `.github/workflows/deploy-hf-ai-space.yml`
- `deploy/hf-ai-space/*`

Required GitHub secret:

- `HF_TOKEN`

Required GitHub variables:

- `HF_USERNAME`
- `HF_AI_SPACE`

Required Hugging Face Space secret:

- `GROQ_API_KEY`

This space deploys a lightweight FastAPI wrapper around `mirror_agent` at `/chat/respond`.

## Backend Space on Hugging Face

Files added:

- `.github/workflows/deploy-hf-backend-space.yml`
- `deploy/hf-backend-space/*`

Required GitHub secret:

- `HF_TOKEN`

Required GitHub variables:

- `HF_USERNAME`
- `HF_BACKEND_SPACE`

Required Hugging Face Space secrets or variables:

- `GROQ_API_KEY`
- `MONGODB_URI`
- `MONGODB_DB_NAME`

This space deploys the production FastAPI backend with `backend_service` and `mirror_agent` together so imports resolve correctly.