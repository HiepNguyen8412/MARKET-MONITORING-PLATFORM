## Phase 4: PaaS Deployment (Vercel)

To deploy the Next.js frontend to Vercel:

1. Connect your GitHub repository to Vercel.
2. The framework will automatically be detected as Next.js.
3. In the **Environment Variables** section of the Vercel project settings, configure:
   - `NEXT_PUBLIC_API_URL`: Set this to your AWS Application Load Balancer URL (e.g., `http://market-alb-1234.ap-southeast-1.elb.amazonaws.com`).
   - `NEXT_PUBLIC_SOCKET_URL`: Set this to the same AWS ALB URL for WebSocket connections.
4. Deploy the project. The configuration in `vercel.json` will apply security headers automatically.
