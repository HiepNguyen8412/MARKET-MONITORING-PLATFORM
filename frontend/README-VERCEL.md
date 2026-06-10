## Phase 4: PaaS Deployment (Vercel)

To deploy the Next.js frontend to Vercel:

1. Connect your GitHub repository to Vercel.
2. The framework will automatically be detected as Next.js.
3. In the **Environment Variables** section of the Vercel project settings, configure:
   - `VITE_API_URL`: Set this to your backend URL (e.g., `https://api.yourdomain.com`).
   - If you use a separate socket URL, set `VITE_SOCKET_URL` (optional). Otherwise `VITE_API_URL` will be used for socket connections.
4. Deploy the project. The configuration in `vercel.json` will apply security headers automatically.
