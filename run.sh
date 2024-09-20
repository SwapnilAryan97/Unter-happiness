#!/bin/bash

# Exit script if any command fails
set -e

# Function to display help message
show_help() {
  echo "Usage: ./run.sh [command]"
  echo "Commands:"
  echo "  install     Install dependencies for both backend and frontend"
  echo "  build       Build the frontend application"
  echo "  start       Start both backend and frontend services"
  echo "  start-backend Start only the backend service"
  echo "  start-frontend Start only the frontend service"
  echo "  clean       Remove node_modules and build directories"
  echo "  help        Display this help message"
}

# Function to install dependencies
install_dependencies() {
  echo "Installing dependencies..."
  npm install
  (cd backend && npm install)
  (cd frontend && npm install)
  echo "Dependencies installed."
}

# Function to build frontend
build_frontend() {
  echo "Building frontend..."
  (cd frontend && npm run build)
  echo "Frontend build complete."
}

# Function to start services
start_services() {
  echo "Starting backend and frontend services..."
  npm start
}

# Function to start only the backend service
start_backend() {
  echo "Starting backend service..."
  (cd backend && npm start)
}

# Function to start only the frontend service
start_frontend() {
  echo "Starting frontend service..."
  (cd frontend && npm start)
}

# Function to clean the project
clean_project() {
  echo "Cleaning project..."
  rm -rf node_modules
  (cd backend && rm -rf node_modules)
  (cd frontend && rm -rf node_modules build)
  echo "Project cleaned."
}

# Check if any argument is passed, if not show help
if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

# Process the command line argument
case $1 in
  install)
    install_dependencies
    ;;
  build)
    build_frontend
    ;;
  start)
    start_services
    ;;
  start-backend)
    start_backend
    ;;
  start-frontend)
    start_frontend
    ;;
  clean)
    clean_project
    ;;
  help)
    show_help
    ;;
  *)
    echo "Invalid command: $1"
    show_help
    exit 1
    ;;
esac