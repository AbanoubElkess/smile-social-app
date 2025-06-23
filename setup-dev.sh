#!/bin/bash

# SMILE Development Setup Script
# This script sets up the complete development environment for SMILE

set -e  # Exit on any error

echo "🚀 Setting up SMILE Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3.9+ is not installed. Please install Python from https://python.org/"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. Some features may not work without Docker."
        print_warning "Please install Docker from https://docker.com/"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose is not installed. Database services may not start."
    fi
    
    print_success "Prerequisites check completed!"
}

# Install project dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    
    # Install root dependencies
    print_status "Installing root dependencies..."
    npm install
    
    # Install shared package dependencies
    print_status "Installing shared package dependencies..."
    cd shared && npm install && cd ..
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend && npm install && cd ..
    
    # Install AI service dependencies
    print_status "Installing AI service dependencies..."
    cd ai-service
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    
    print_success "All dependencies installed!"
}

# Setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env
        print_warning "Please edit .env file with your actual configuration values"
    else
        print_status ".env file already exists"
    fi
    
    # Generate JWT secrets if not set
    if grep -q "your-super-secret-jwt-key-change-this-in-production" .env; then
        JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_urlsafe(32))")
        JWT_REFRESH_SECRET=$(openssl rand -base64 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_urlsafe(32))")
        
        # Replace placeholder secrets
        sed -i.bak "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" .env
        sed -i.bak "s/your-refresh-token-secret-change-this-too/$JWT_REFRESH_SECRET/" .env
        rm -f .env.bak
        
        print_success "Generated secure JWT secrets"
    fi
    
    print_success "Environment setup completed!"
}

# Setup databases
setup_databases() {
    print_status "Setting up databases..."
    
    if command -v docker-compose &> /dev/null; then
        print_status "Starting database services with Docker Compose..."
        docker-compose up -d postgres redis mongodb
        
        # Wait for databases to be ready
        print_status "Waiting for databases to be ready..."
        sleep 10
        
        print_success "Database services started!"
    else
        print_warning "Docker Compose not available. Please start databases manually."
        print_warning "Required services: PostgreSQL, Redis, MongoDB"
    fi
}

# Build shared package
build_shared() {
    print_status "Building shared package..."
    cd shared
    npm run build
    cd ..
    print_success "Shared package built!"
}

# Setup database schema
setup_database_schema() {
    print_status "Setting up database schema..."
    
    if [ -f backend/prisma/schema.prisma ]; then
        cd backend
        print_status "Generating Prisma client..."
        npx prisma generate
        
        print_status "Running database migrations..."
        npx prisma db push
        
        cd ..
        print_success "Database schema setup completed!"
    else
        print_warning "Prisma schema not found. Skipping database setup."
    fi
}

# Main setup function
main() {
    echo "🎉 Welcome to SMILE Development Setup!"
    echo "This script will set up your complete development environment."
    echo ""
    
    check_prerequisites
    install_dependencies
    setup_environment
    build_shared
    setup_databases
    setup_database_schema
    
    print_success "✅ Setup completed successfully!"
    echo ""
    echo "🚀 To start the development servers:"
    echo "   npm run dev              # Start all services"
    echo "   npm run dev:frontend     # Start frontend only"
    echo "   npm run dev:backend      # Start backend only"
    echo "   npm run dev:ai           # Start AI service only"
    echo ""
    echo "📱 URLs:"
    echo "   Frontend:  http://localhost:3000"
    echo "   Backend:   http://localhost:3001"
    echo "   AI Service: http://localhost:8001"
    echo ""
}

# Handle Ctrl+C
trap 'echo -e "\n\n${RED}Setup interrupted by user${NC}"; exit 1' INT

# Run main function
main "$@"
