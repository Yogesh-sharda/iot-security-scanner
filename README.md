# IoT Security Scanner - Production V2

A modern, production-grade cybersecurity platform built with Flask and React. It integrates with the Shodan API to scan internet-exposed devices, featuring real-time simulated SOC logs, role-based access control, analytics charting, and comprehensive risk analysis.

## Features
- **Real Shodan Integration**: Async backend scanning using `ThreadPoolExecutor`.
- **Risk Analysis Engine**: Detects vulnerable banners and rates findings on a 0-100 scale.
- **Robust Authentication**: JWT-based auth with automatic token refreshes via Axios interceptors and marshalled input validation.
- **SOC-Style Dashboard**: Live terminal feed during scans, pagination, filtering, and high-risk highlighting.
- **Role-Based Access**: Admins get global analytics and full history; Analysts are restricted to their own operations.
- **Backend Logging**: Rotating file logs for all system events, auth attempts, and errors inside `backend/logs/`.

## Backend Setup
1. `cd backend`
2. Create virtual environment: `python3 -m venv venv` and activate it: `source venv/bin/activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Set up `.env` file from the example (You MUST provide a valid Shodan API key):
   ```bash
   cp .env.example .env
   ```
5. Run the server: `python app.py` (or deploy via Gunicorn: `gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()`)

## Frontend Setup
1. `cd frontend`
2. Install NodeJS dependencies: `npm install`
3. Run the development server: `npm run dev`
4. For production build: `npm run build`

## Architecture overview
- **Frontend**: React, Vite, TailwindCSS, Chart.js, Axios, Lucide-React.
- **Backend**: Flask, Flask-RESTful, Flask-JWT-Extended, Flask-SQLAlchemy, Marshmallow, Flask-Limiter, Shodan.
