# URL Shortener Microservices

[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

A scalable URL shortening platform built with a Node.js microservices architecture. It demonstrates clean architecture, event-driven communication, distributed data stores, caching, and containerized deployment.

## Features

- Fast URL shortening with auto-generated codes
- User registration, login (JWT), and profile
- Click analytics with browser, OS, device, referrer, and location tracking
- Redis caching for high-performance redirects
- Event-driven pipeline (RabbitMQ) from URL clicks to analytics
- API gateway with rate limiting and security headers
- Fully containerized with Docker Compose

## 🏗️ Architecture

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'darkMode': true, 'background': '#333', 'primaryTextColor': '#fff' }}}%%
graph TD
    Client([Client/Browser]) --> Gateway[API Gateway]

    subgraph "URL Shortener System"
        Gateway --> |Auth Requests| UserService[User Service]
        Gateway --> |URL Requests| URLService[URL Service]
        Gateway --> |Analytics Requests| AnalyticsService[Analytics Service]

        URLService --> |Publishes Events| RabbitMQ{RabbitMQ}
        RabbitMQ --> |Consumes Events| AnalyticsService

        URLService --> MongoDB[(MongoDB)]
        URLService --> Redis[(Redis Cache)]
        UserService --> PostgreSQL[(PostgreSQL)]
        AnalyticsService --> MongoDB

        subgraph "User Service"
            UserService --> UserController[Controller]
            UserController --> UserService_Service[Service]
            UserService_Service --> UserRepository[Repository]
            UserRepository --> PostgreSQL
        end

        subgraph "URL Service"
            URLService --> URLController[Controller]
            URLController --> URLService_Service[Service]
            URLService_Service --> URLRepository[Repository]
            URLRepository --> MongoDB
            URLService_Service --> URLCache[Cache]
            URLCache --> Redis
        end

        subgraph "Analytics Service"
            AnalyticsService --> AnalyticsController[Controller]
            AnalyticsController --> AnalyticsService_Service[Service]
            AnalyticsService_Service --> AnalyticsRepository[Repository]
            AnalyticsRepository --> MongoDB
            RabbitMQ --> AnalyticsConsumer[Consumer]
            AnalyticsConsumer --> AnalyticsService_Service
        end
    end

    class Client,Gateway,UserService,URLService,AnalyticsService,RabbitMQ,MongoDB,Redis,PostgreSQL,UserController,UserService_Service,UserRepository,URLController,URLService_Service,URLRepository,URLCache,AnalyticsController,AnalyticsService_Service,AnalyticsRepository,AnalyticsConsumer nodeStyle

    %% Styles that work in both light and dark modes
    classDef nodeStyle fill:#f9f9f9,stroke:#333,stroke-width:1px,color:#333
    classDef microservice fill:#d1f0fd,stroke:#0078d4,stroke-width:2px,color:#333
    classDef database fill:#e7f5d7,stroke:#5ca53a,stroke-width:2px,color:#333
    classDef messagebroker fill:#fde7c7,stroke:#ff8c00,stroke-width:2px,color:#333
    classDef gateway fill:#e7d1fd,stroke:#7b2cbf,stroke-width:2px,color:#333
    classDef client fill:#f5f5f5,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5,color:#333

    class UserService,URLService,AnalyticsService microservice
    class MongoDB,PostgreSQL,Redis database
    class RabbitMQ messagebroker
    class Gateway gateway
    class Client client
```

## 🧩 Architectural Patterns & Design Principles

This project implements several industry-standard architectural patterns and design principles:

### Clean Architecture

- **Separation of Concerns**: Each service is organized into layers with clear boundaries
- **Domain-Driven Design**: Business logic is isolated from infrastructure concerns
- **Use Cases**: Business rules are defined as use cases in service layers
- **Dependency Rule**: Dependencies point inward, with inner layers unaware of outer layers

### Dependency Injection (DI)

- **Inversion of Control**: Using TypeScript-based DI containers for service instantiation
- **Testability**: Dependencies can be easily mocked for unit testing
- **Loose Coupling**: Components interact through abstractions rather than concrete implementations

### Repository Pattern

- **Data Access Abstraction**: Repository interfaces isolate business logic from data access
- **Persistence Ignorance**: Business logic remains independent of specific database implementations
- **Interchangeable Data Sources**: Ability to swap MongoDB, PostgreSQL, or other datastores with minimal code changes

### SOLID Principles

- **Single Responsibility**: Each class and module has one clear responsibility
- **Open/Closed**: Entities are open for extension but closed for modification
- **Liskov Substitution**: Interfaces are designed to ensure subtypes can be substituted for base types
- **Interface Segregation**: Small, focused interfaces prevent unnecessary dependencies
- **Dependency Inversion**: High-level modules depend on abstractions, not concrete implementations

### Event-Driven Architecture

- **Message Brokers**: RabbitMQ facilitates loose coupling between services
- **Asynchronous Communication**: Services communicate through events without direct dependencies
- **Eventual Consistency**: Data is synchronized across services asynchronously
- **Fault Tolerance**: Services can continue to operate despite failures in other services

### API Gateway Pattern

- **Single Entry Point**: Unified API interface for all client communications
- **Cross-Cutting Concerns**: Centralized handling of authentication, logging, and monitoring
- **Request Routing**: Dynamic routing of requests to appropriate microservices
- **API Composition**: Aggregation of data from multiple services for client requests

The system consists of four main microservices:

### 1. API Gateway

- Entry point for all client requests
- Handles request routing to appropriate services via proxy
- Implements rate limiting, security headers, and CORS

### 2. URL Service

- Core service for URL shortening functionality
- Creates and stores short URLs with MongoDB
- Uses Redis for caching frequently accessed URLs
- Publishes analytics events to RabbitMQ

### 3. User Service

- Manages user registration and authentication
- Stores user data in PostgreSQL with Prisma ORM
- Handles JWT token generation and validation
- Password encryption with bcrypt

### 4. Analytics Service

- Processes URL access events from RabbitMQ
- Tracks and stores analytics data in MongoDB
- Provides detailed analytics on URL performance
- Captures data on geographic location, referrers, browsers, devices, and OS

## 💾 Data Storage

- **PostgreSQL**: User accounts and related data
- **MongoDB**: URL mappings and analytics information
- **Redis**: High-performance caching for frequent URL lookups
- **RabbitMQ**: Message broker for event-driven communication between services

## Tech Stack

- **Runtime & Language:** Node.js 22, TypeScript, Express 5
- **Databases:** PostgreSQL (Prisma), MongoDB (Mongoose), Redis
- **Messaging:** RabbitMQ (amqplib)
- **Auth:** JWT, bcrypt
- **Validation:** Zod
- **Shared code:** `src/common` in each service (logger, error classes, auth types)
- **DevOps:** Docker, Docker Compose
- **Quality:** ESLint, Prettier, Jest

## Project Structure

```text
.
├── api-gateway/          # Request routing, rate limiting (port 3000)
├── user-service/         # Auth + users, Prisma/PostgreSQL (port 3001)
│   └── prisma/           # Schema and migrations
├── url-service/          # Shortening + redirect, Mongo/Redis (port 3002)
├── analytics-service/    # Click analytics consumer + API (port 3003)
├── volumes/
│   └── docker-compose.yml
└── README.md

# Inside each service (the gateway only has common/config/middlewares):
src/
├── common/        # Shared logger, error classes, auth types
├── config/        # Env, app, db configuration
├── controllers/
├── services/
├── repositories/
├── routes/
├── middlewares/
├── app.ts
└── server.ts
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 22+ (for local development only)

### 1. Clone the repository

```bash
git clone https://github.com/ayushjoshi45/url-shortener.git
cd url-shortener
```

### 2. Configure environment variables

Create a `.env` file inside **each** service directory. These files are git-ignored and never committed.

**api-gateway/.env**

| Variable                | Example               |
| ----------------------- | --------------------- |
| PORT                    | 3000                  |
| USER_SERVICE_URL        | http://localhost:3001 |
| URL_SERVICE_URL         | http://localhost:3002 |
| ANALYTICS_SERVICE_URL   | http://localhost:3003 |
| RATE_LIMIT_WINDOW_MS    | 60000                 |
| RATE_LIMIT_MAX_REQUESTS | 100                   |

**user-service/.env**

| Variable       | Example                                        |
| -------------- | ---------------------------------------------- |
| PORT           | 3001                                           |
| DATABASE_URL   | postgresql://postgres:postgres@localhost:5432/users_db |
| BASE_URL       | http://localhost:3000                          |
| URL_SERVICE_URL| http://localhost:3002                          |
| JWT_SECRET     | <generate-a-long-random-string>                 |
| JWT_EXPIRES_IN | 1d                                             |

**url-service/.env**

| Variable          | Example                          |
| ----------------- | -------------------------------- |
| PORT              | 3002                             |
| DATABASE_URL      | mongodb://localhost:27017/urls_db |
| REDIS_URL         | redis://localhost:6379           |
| SHORT_URL_CACHE_TTL | 3600                           |
| USER_SERVICE_URL  | http://localhost:3001            |
| BASE_URL          | http://localhost:3000            |
| RABBITMQ_URL      | amqp://admin:admin@localhost:5672 |

**analytics-service/.env**

| Variable     | Example                               |
| ------------ | ------------------------------------- |
| PORT         | 3003                                  |
| DATABASE_URL | mongodb://localhost:27017/analytics_db |
| RABBITMQ_URL | amqp://admin:admin@localhost:5672      |

### 3. Run with Docker Compose

```bash
cd volumes
docker compose up -d --build
```

Services will be available at:

- API Gateway: http://localhost:3000
- User Service: http://localhost:3001
- URL Service: http://localhost:3002
- Analytics Service: http://localhost:3003
- RabbitMQ dashboard: http://localhost:15672

### 4. Local development (optional)

Each service runs independently:

```bash
cd <service-directory>
npm install
npm run dev
```

> The compose file wires services together with container hostnames (e.g. `http://user_service:3001`). For local development, point the `*_URL` variables at `localhost` instead.

## API Reference

All client traffic goes through the API Gateway (`:3000`).

### User Service

- `POST /api/users/register` — Register a new user
- `POST /api/users/login` — Login and receive a JWT
- `GET /api/users/me` — Current user details (authenticated)
- `GET /api/users/validate-token` — Validate a JWT (used by other services)

### URL Service

- `POST /api/urls` — Create a short URL (authenticated)
- `GET /api/urls/user` — List URLs for the authenticated user
- `GET /api/urls/url/:shortCode` — Get a URL by short code (authenticated)
- `DELETE /api/urls/:id` — Delete a URL (authenticated)
- `GET /:shortCode` — Redirect to the original URL (public, tracked)

### Analytics Service

- `GET /api/analytics/:urlId` — Analytics for a specific URL (authenticated)
- `POST /api/analytics/urls` — Analytics for multiple URLs (authenticated)

## Branching & Contributing

- `production` — stable releases (protected, no direct pushes)
- `dev` — integration branch for all features (protected, no direct pushes)
- `feature/<name>` / `fix/<name>` — short-lived branches off `dev`, merged back via pull request

Rules:

1. Never commit `.env` files or secrets.
2. Keep services independent — shared code lives in `src/common`.
3. Add/update tests for service changes (`npm test`).

## Maintainer

Maintained by [@ayushjoshi45](https://github.com/ayushjoshi45).
