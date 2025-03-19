# Construction Progress Monitoring System

This is a full-stack application for monitoring construction progress with a React frontend and Node.js backend.

## Prerequisites

- Node.js v18.19.0
- MongoDB
- Docker and Docker Compose (optional, for running with Docker)

## Project Structure

```
.
├── client/             # React frontend
├── server/             # Node.js backend
├── docker-compose.yml  # Docker compose configuration
└── README.md
```

## Running Without Docker

### 1. Start MongoDB

First, ensure MongoDB is running on your system. The default connection string is:
```
mongodb://127.0.0.1:27017/construction-progress
```

### 2. Start the Backend Server

Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in the server directory with the following variables:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/construction-progress
JWT_SECRET=your_construction_site_monitoring_jwt_secret
JWT_EXPIRE=30d
NODE_ENV=development
UPLOAD_PATH=uploads
MAX_FILE_SIZE=50000000
```

Start the server:
```bash
npm run dev
```

The server will run on http://localhost:5000

### 3. Start the Frontend

In a new terminal, navigate to the client directory and install dependencies:
```bash
cd client
npm install
```

Start the development server:
```bash
npm start
```

The frontend will run on http://localhost:3000

## Running With Docker

### Using Docker Compose (Recommended)

1. Make sure Docker and Docker Compose are installed on your system.

2. From the root directory, run:
```bash
docker-compose up --build
```

This will:
- Build and start the frontend on http://localhost:3000
- Build and start the backend on http://localhost:5000
- Start MongoDB on localhost:27017
- Set up hot-reloading for both frontend and backend
- Create necessary volumes for data persistence

### Individual Docker Commands

If you prefer to run services individually:

1. Build and run MongoDB:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

2. Build and run the backend:
```bash
cd server
docker build -t construction-server .
docker run -d -p 5000:5000 \
  -e MONGODB_URI=mongodb://mongodb:27017/construction-progress \
  -e JWT_SECRET=your_construction_site_monitoring_jwt_secret \
  -e JWT_EXPIRE=30d \
  -e NODE_ENV=development \
  -e UPLOAD_PATH=uploads \
  -e MAX_FILE_SIZE=50000000 \
  --name construction-server \
  construction-server
```

3. Build and run the frontend:
```bash
cd client
docker build -t construction-client .
docker run -d -p 3000:3000 \
  -e CHOKIDAR_USEPOLLING=true \
  --name construction-client \
  construction-client
```

## Development Features

### Hot Reloading

Both Docker and non-Docker setups support hot reloading:
- Frontend changes will automatically refresh in the browser
- Backend changes will automatically restart the server

### File Uploads

Uploaded files are stored in:
- Docker: Persisted in the `./server/uploads` directory
- Non-Docker: Stored in the `server/uploads` directory

### Environment Variables

The application uses the following environment variables:

#### Backend
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT token generation
- `JWT_EXPIRE`: JWT token expiration time
- `NODE_ENV`: Environment (development/production)
- `UPLOAD_PATH`: Directory for file uploads
- `MAX_FILE_SIZE`: Maximum file upload size in bytes

#### Frontend
- `CHOKIDAR_USEPOLLING`: Enable file watching in Docker (default: true)

## Troubleshooting

1. If you encounter port conflicts:
   - Check if any other services are using ports 3000, 5000, or 27017
   - Modify the port mappings in docker-compose.yml or use different ports

2. For MongoDB connection issues:
   - Ensure MongoDB is running
   - Check the connection string in your environment variables
   - Verify network connectivity between services

3. For hot reloading issues:
   - In Docker: Ensure volume mounts are working correctly
   - Check if the CHOKIDAR_USEPOLLING environment variable is set

## Stopping the Application

### Docker Compose
```bash
docker-compose down
```

### Individual Docker Containers
```bash
docker stop mongodb construction-server construction-client
docker rm mongodb construction-server construction-client
```

### Non-Docker
- Press Ctrl+C in the terminal running the frontend and backend servers
- Stop MongoDB using your system's service manager 