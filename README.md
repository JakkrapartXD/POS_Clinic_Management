# Backend Initialization Guide

This guide helps you set up the backend environment for development.

## 1. Environment Variables

Set up environment variables for both backend and frontend. Use different `.env` files for Docker, development, and production.

### Backend `.env` Example

```env
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_database_url
SNADMIN_USERNAME=your_admin_username
SNADMIN_PASSWORD=your_admin_password
```

## 2. Database Setup (Development)

Run the database container for development:

```sh
docker-compose up -d postgres redis
```

## 3. Backend Setup

Navigate to the backend directory:

```sh
cd backend
```

Install dependencies (if needed):

```sh
bun install
```

Run the database setup script:

```sh
bun run setup-db
```

Start the backend in development mode:

```sh
bun run dev
```
The backend API should now be running at http://localhost:4000

---

**Note:**  
- Ensure all environment variables are set before running the backend.
- Adjust variable values as needed for your environment.
- For production, use secure values and proper Docker configuration.