<<<<<<< HEAD
# Market Monitoring System

A real-time market monitoring platform with live dashboards, price tracking, AI-based forecasting, watchlists, and alerts.

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Recharts, Zustand, Socket.io
- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, Socket.io
- **ML-Service**: Python 3.10, FastAPI, Pandas, Scikit-learn

## Setup and Running

1. Clone or generate the repository.
2. Ensure Docker and Docker Compose are installed on your machine.
3. Run the following command:

```bash
docker-compose up --build
```

4. The first time you run this, the backend Dockerfile will automatically push the Prisma schema and seed the database with demo assets and a test user.

## Services
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000
- **ML-Service**: http://localhost:8000
- **PostgreSQL**: port 5432
- **Redis**: port 6379

## Features
- Real-time simulated price updates via WebSocket.
- AI Forecasting using simple linear regression based on recent price trends.
- User authentication (JWT).
- Watchlists and Price Alerts.

## Default Accounts
- **Email**: test@example.com
- **Password**: password123
=======
# MARKET-MONITORING-PLATFORM
>>>>>>> 44e6bbb0bc8f9f13a0a0be6439a156c632b1b5b4
