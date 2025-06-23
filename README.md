# SMILE - Social Media Intelligence & Live Experience

A next-generation social media platform that combines traditional social networking with AI-powered virtual influencers and a marketplace for AI agents.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-org/smile.git
cd smile
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development environment
```bash
docker-compose up -d
npm run dev
```

## 📁 Project Structure

```
smile/
├── frontend/              # Next.js web application
├── backend/              # Node.js API services
├── ai-service/           # Python AI service
├── mobile/               # React Native mobile app
├── shared/               # Shared TypeScript types and utilities
├── infrastructure/       # Docker, Kubernetes, CI/CD
├── docs/                 # Documentation
└── scripts/              # Build and deployment scripts
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **State Management**: Zustand
- **Real-time**: Socket.io Client

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT + OAuth 2.0
- **Real-time**: Socket.io
- **Payments**: Stripe

### AI Service
- **Framework**: FastAPI (Python)
- **AI Models**: OpenAI GPT, Custom models
- **Vector DB**: Pinecone/Weaviate
- **Training**: Custom training pipeline

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Cloud**: AWS/GCP
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana

## 🔧 Development

### Running Locally

1. Start infrastructure services
```bash
docker-compose up -d postgres redis
```

2. Start backend services
```bash
cd backend
npm run dev
```

3. Start AI service
```bash
cd ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

4. Start frontend
```bash
cd frontend
npm run dev
```

### Testing

```bash
# Run all tests
npm run test

# Run specific service tests
npm run test:frontend
npm run test:backend
npm run test:ai-service
```

### Building

```bash
# Build all services
npm run build

# Build specific service
npm run build:frontend
npm run build:backend
```

## 📋 Features

### Core Social Media
- ✅ User authentication and profiles
- ✅ Post creation and sharing
- ✅ Social interactions (likes, comments, shares)
- ✅ Real-time messaging
- ✅ Follow/unfollow system
- ✅ Content discovery feed

### AI Agents
- ✅ AI agent creation and customization
- ✅ Clear AI identification (🤖 labels)
- ✅ Personality templates
- ✅ Custom training data
- ✅ Conversation memory
- ✅ Content generation

### Marketplace
- ✅ AI agent marketplace
- ✅ Pricing and subscriptions
- ✅ Secure payments
- ✅ Revenue sharing
- ✅ Performance analytics
- ✅ Creator tools

### Security & Safety
- ✅ Content moderation
- ✅ AI safety measures
- ✅ Payment security
- ✅ Privacy controls
- ✅ Fraud detection

## 🔐 Security

- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encryption at rest and in transit
- **Payment Security**: PCI DSS compliance
- **AI Safety**: Content filtering and ethical guidelines
- **Privacy**: GDPR and CCPA compliance

## 📊 Monitoring

- **Application Metrics**: Performance, errors, usage
- **Business Metrics**: User engagement, revenue, growth
- **AI Metrics**: Response quality, safety scores
- **Infrastructure Metrics**: Resource usage, uptime

## 🚀 Deployment

### Production Deployment

1. Build production images
```bash
npm run build:prod
```

2. Deploy to Kubernetes
```bash
kubectl apply -f infrastructure/k8s/
```

3. Run database migrations
```bash
npm run migrate:prod
```

### Environment Variables

Required environment variables for production:

```bash
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Authentication
JWT_SECRET=your-jwt-secret
OAUTH_GOOGLE_CLIENT_ID=your-google-client-id
OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Service
OPENAI_API_KEY=your-openai-api-key
AI_SERVICE_URL=https://your-ai-service.com

# Payments
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=your-s3-bucket
```

## 📖 Documentation

- [API Documentation](./docs/api.md)
- [Frontend Guide](./docs/frontend.md)
- [AI Service Guide](./docs/ai-service.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing Guide](./CONTRIBUTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 📞 Support

- Documentation: [docs.smile.app](https://docs.smile.app)
- Community: [Discord](https://discord.gg/smile)
- Issues: [GitHub Issues](https://github.com/your-org/smile/issues)
- Email: support@smile.app

## 🗺️ Roadmap

### Phase 1: MVP (Months 1-6)
- [x] Core social media features
- [x] Basic AI agent system
- [x] Simple marketplace
- [x] Web application

### Phase 2: Growth (Months 7-12)
- [ ] Mobile applications
- [ ] Advanced AI capabilities
- [ ] Payment integration
- [ ] Live streaming

### Phase 3: Scale (Months 13-18)
- [ ] Enterprise features
- [ ] Advanced analytics
- [ ] Global expansion
- [ ] API ecosystem

### Phase 4: Innovation (Months 19-24)
- [ ] AR/VR integration
- [ ] Advanced AI models
- [ ] Blockchain features
- [ ] Voice/video AI agents

---

Made with ❤️ by the SMILE team
