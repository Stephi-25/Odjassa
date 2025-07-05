# Odjassa-Net E-commerce Platform

Odjassa-Net is a comprehensive e-commerce platform designed to connect vendors, customers, and delivery personnel.

## Project Structure

The project is organized into the following main directories:

-   `frontend/`: Contains the React client application for customers and vendors.
-   `backend/`: Contains the Node.js/Express API server.
-   `admin-panel/`: Contains a separate application for administrative tasks (details TBD).
-   `database/`: Contains SQL migrations, seeds, and schema definitions.
-   `tests/`: Contains unit, integration, and end-to-end tests.
-   `docs/`: Contains project documentation (API, Database, Deployment).
-   `docker/`: Contains Dockerfiles and docker-compose configurations for containerization.

## Phases Overview

### Phase 1 - MVP (Target: ~1 week from now)
*   **Objective**: Core functionalities operational.
*   **Key Features**:
    *   PostgreSQL Database Setup
    *   Basic REST API (Authentication, Users, Products)
    *   React Frontend with Authentication
    *   Product Management (CRUD for vendors, basic moderation, image upload)
    *   Order System (basic flow, status management, email notifications)
    *   Delivery Interface (basic tracking)
    *   Initial Tests & MVP Deployment Strategy

### Phase 2 - V1
*   **Objective**: Advanced features and User Experience enhancements.
*   **(Details TBD)**

### Phase 3 - V2
*   **Objective**: Premium features and Scaling.
*   **(Details TBD)**

## Getting Started

(Instructions to be added once the initial setup is more complete)

### Prerequisites

*   Node.js (version TBD)
*   npm or yarn
*   PostgreSQL
*   Docker (optional, for containerized setup)

### Backend Setup

```bash
cd backend
# npm install (currently handled manually due to sandbox limitations)
# Configure .env file with database credentials etc.
npm run dev
```

### Frontend Setup

```bash
cd frontend
# npm install (currently handled manually due to sandbox limitations)
npm start
```

## Contributing

(Guidelines to be added)

## License

(License to be added)
