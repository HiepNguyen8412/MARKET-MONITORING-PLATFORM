# Market Monitoring Platform

This project is a market monitoring platform built to track and visualize asset price movements in real time. The system includes a live dashboard, forecasting features, watchlists, and notification support for market changes.

## Technologies Used

### Frontend

* Next.js 14
* TypeScript
* Tailwind CSS
* Recharts
* Zustand
* Socket.io Client

### Backend

* Node.js
* Express.js
* Prisma ORM
* PostgreSQL
* Redis
* Socket.io

### Machine Learning Service

* Python 3.10
* FastAPI
* Pandas
* Scikit-learn

---

## Project Features

* Real-time market price updates
* Interactive charts and dashboards
* Asset watchlist management
* Alert system for price changes
* JWT-based authentication
* Forecasting module using historical trend analysis

---

## Running the Project

### Requirements

* Docker
* Docker Compose

### Start the system

```bash
docker-compose up --build
```

When the containers are started for the first time, the backend service automatically initializes the database and inserts sample data.

---

## Service Ports

| Service    | URL / Port            |
| ---------- | --------------------- |
| Frontend   | http://localhost:3000 |
| Backend    | http://localhost:4000 |
| ML Service | http://localhost:8000 |
| PostgreSQL | 5432                  |
| Redis      | 6379                  |

---

## Test Account

```text
Email: test@example.com
Password: password123
```
