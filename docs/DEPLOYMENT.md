# Deployment Documentation

This document outlines the strategy and steps for deploying the Odjassa-Net platform.

## Overview

The platform consists of three main deployable components:
1.  **Frontend (React Application)**: Static assets to be served by a web server or CDN.
2.  **Backend (Node.js/Express API)**: A Node.js application server.
3.  **Admin Panel (React Application)**: Static assets, potentially served similarly to the main frontend or as part of the backend's responsibility if tightly coupled.

A **PostgreSQL database** is also required.

## Phase 1 - MVP Deployment Strategy

For the MVP, the focus will be on a simple and cost-effective deployment.

**Target Environment:** (To be decided - e.g., Heroku, AWS EC2, DigitalOcean Droplet, Vercel/Netlify for frontend)

### Backend API (Node.js/Express)

*   **Containerization:** Use Docker (`docker/Dockerfile.backend` and `docker-compose.yml`).
    *   The Docker image will bundle the Node.js runtime and the application code.
    *   Environment variables will be used for configuration (database connection, JWT secrets, etc.).
*   **Hosting:**
    *   Option 1 (PaaS): Heroku - `git push heroku main` after configuring Heroku Postgres.
    *   Option 2 (IaaS): A small cloud server (EC2, Droplet) running Docker.
        *   Use a process manager like PM2 inside the Docker container for robust Node.js process management.
        *   A reverse proxy (Nginx or Caddy) can be set up in front of the Node.js application for SSL termination and load balancing (if needed later).
*   **Database:**
    *   Managed PostgreSQL service (e.g., Heroku Postgres, AWS RDS, DigitalOcean Managed Database). This is preferred over self-hosting for reliability and maintenance.

### Frontend (React)

*   **Build:** Build the React app into static HTML, CSS, and JavaScript files (`npm run build` in `frontend/`).
*   **Hosting:**
    *   Option 1 (Static Hosting Platforms): Vercel, Netlify, GitHub Pages. These platforms are optimized for static sites and offer easy deployment, SSL, and CDN.
    *   Option 2 (Cloud Storage): AWS S3 (configured for website hosting) + CloudFront (for CDN and SSL).
    *   Option 3 (Traditional Web Server): Serve the static files using Nginx or Apache on the same server as the backend (if using IaaS).
*   **Configuration:** The frontend will need to know the URL of the backend API. This can be set via environment variables during the build process.

### Admin Panel (React)

*   Deployment strategy similar to the main frontend. It might be a sub-route of the main domain or a separate subdomain.

### Domain & DNS

*   A domain name will be acquired (e.g., `odjassa.net`).
*   DNS records will be configured to point to the frontend and backend services.

## General Deployment Process (Conceptual)

1.  **Code Repository:** Code hosted on a Git provider (e.g., GitHub, GitLab).
2.  **CI/CD (Future Consideration for V1/V2):**
    *   Automated builds, tests, and deployments using GitHub Actions, GitLab CI, or Jenkins.
3.  **Environment Configuration:**
    *   `staging` environment for testing before production.
    *   `production` environment for the live application.
    *   Use environment variables extensively to manage differences between environments (API keys, database URLs, etc.). `.env` files for local development, platform-specific environment variable settings for deployed environments.
4.  **Database Migrations:**
    *   Migrations (in `database/migrations/`) must be run against the target database before deploying new application code that depends on schema changes. This can be a manual step for MVP or automated as part of a CI/CD pipeline.
5.  **Logging & Monitoring (Basic for MVP, enhanced later):**
    *   Backend: Console logging, potentially integrated with a platform's logging service (e.g., Heroku logs).
    *   Frontend: Basic error tracking (e.g., Sentry free tier).

## Docker Setup (`docker/`)

*   `Dockerfile.frontend`: To build a Docker image for the frontend (e.g., using a multi-stage build with Nginx to serve static files).
*   `Dockerfile.backend`: To build a Docker image for the backend Node.js application.
*   `docker-compose.yml`: For local development, to easily spin up the backend, frontend (if served via Node/Nginx), and PostgreSQL database. It can also serve as a basis for deployment in some environments.

**Example `docker-compose.yml` structure (for local dev):**
```yaml
version: '3.8'
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.backend # Assuming you create this
    ports:
      - "4000:4000" # Or whatever port your backend runs on
    environment:
      - DATABASE_URL=postgres://user:password@db:5432/odjassanet
      # Other env vars
    depends_on:
      - db
    volumes:
      - ./backend/src:/app/src # For hot-reloading if nodemon is used

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.frontend # Assuming you create this
    ports:
      - "3000:3000" # Or port served by react-scripts / nginx
    # environment:
      # - REACT_APP_API_URL=http://localhost:4000/api/v1
    depends_on:
      - backend
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public

  db:
    image: postgres:13
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=odjassanet
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Next Steps for MVP Deployment

1.  Finalize choice of hosting platforms.
2.  Create `Dockerfile.backend` and `Dockerfile.frontend`.
3.  Refine `docker-compose.yml` for local development and as a deployment reference.
4.  Set up chosen database service.
5.  Implement build scripts in `package.json` for frontend and backend.
6.  Perform a manual test deployment.
