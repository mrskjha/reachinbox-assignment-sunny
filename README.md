# ReachInbox — Full-Stack Email Automation & Scheduling Platform

> A production-oriented, containerized email automation platform designed for reliable campaign scheduling, asynchronous job execution, rate limiting, and high-performance email search.

---

## Overview

ReachInbox is a full-stack email automation platform that enables users to authenticate with Google, create bulk email campaigns, schedule individual email jobs, and monitor delivery status in real time.

The system is designed around an **asynchronous, queue-driven architecture**. Email dispatching is decoupled from the API layer using **Redis + BullMQ**, while **Elasticsearch** provides low-latency search across email history.

The complete system is containerized using **Docker Compose**, allowing all services to run in an isolated internal network with consistent configuration and reproducible local environments.

### Core Engineering Goals

* Reliable asynchronous email processing
* Idempotent job execution
* Configurable email throttling
* Hourly sending-rate enforcement
* Fault-tolerant background workers
* Fast email-history search
* Real-time queue observability
* Strong separation between API, persistence, and job-processing layers
* Reproducible development environment through Docker

---

# System Architecture

```text
                         ┌──────────────────────┐
                         │      User / Browser   │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Next.js Frontend   │
                         │                      │
                         │ • Dashboard          │
                         │ • Campaign Creation  │
                         │ • Search             │
                         │ • Authentication     │
                         └──────────┬───────────┘
                                    │ REST API
                                    ▼
                    ┌──────────────────────────────┐
                    │      Node.js / Express API   │
                    │                              │
                    │ • Authentication Sync        │
                    │ • Campaign Management        │
                    │ • Scheduling                  │
                    │ • Email Status APIs          │
                    └───────┬───────────┬──────────┘
                            │           │
                  ┌─────────▼───┐   ┌──▼─────────────┐
                  │ PostgreSQL  │   │ Redis / BullMQ │
                  │             │   │                │
                  │ Users       │   │ Job Queue      │
                  │ Email Jobs  │   │ Delayed Jobs   │
                  │ Status      │   │ Rate Limits    │
                  └─────────────┘   └───────┬────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │ Background      │
                                   │ Worker          │
                                   │                 │
                                   │ • Job execution │
                                   │ • Throttling    │
                                   │ • Retry logic   │
                                   │ • Idempotency   │
                                   └────────┬────────┘
                                            │
                              ┌─────────────┴────────────┐
                              ▼                          ▼
                    ┌──────────────────┐       ┌──────────────────┐
                    │ Email Provider   │       │ Elasticsearch    │
                    │ / SMTP           │       │                  │
                    │                  │       │ Email indexing   │
                    └──────────────────┘       │ Full-text search │
                                               └──────────────────┘

                              ┌──────────────────┐
                              │ Bull Board       │
                              │ Queue Monitoring │
                              └──────────────────┘
```

---

# Technology Stack

| Layer                | Technology        | Responsibility                            |
| -------------------- | ----------------- | ----------------------------------------- |
| Frontend             | Next.js / React   | Dashboard and client-side application     |
| Styling              | Tailwind CSS      | UI styling and responsive layouts         |
| Icons                | Lucide React      | UI iconography                            |
| Authentication       | NextAuth.js       | Google OAuth authentication               |
| Backend              | Node.js + Express | REST API and business logic               |
| Language             | TypeScript        | Type-safe application development         |
| ORM                  | Prisma            | Database access and schema management     |
| Database             | PostgreSQL        | Persistent relational storage             |
| Queue                | BullMQ            | Distributed background job processing     |
| Cache / Coordination | Redis             | Queue backend and rate limiting           |
| Search               | Elasticsearch     | Indexed email-history search              |
| Infrastructure       | Docker Compose    | Local orchestration and service isolation |

---

# Key Features

## 1. Google Authentication

Authentication is implemented using **NextAuth.js with Google OAuth**.

After successful authentication:

1. NextAuth establishes the frontend session.
2. The authenticated user is synchronized with the backend.
3. User-specific campaigns and email jobs are associated with the corresponding database record.
4. Protected application resources can be accessed through the authenticated session.

---

## 2. Bulk Email Scheduling

Users can create campaigns by providing recipients through:

* CSV files
* TXT files
* Comma-separated email addresses
* Manually entered recipients

Each recipient is converted into an independent background job.

```text
Campaign
   │
   ├── Recipient 1 → Job 1
   ├── Recipient 2 → Job 2
   ├── Recipient 3 → Job 3
   └── Recipient N → Job N
```

This design prevents a large campaign from blocking the API request and allows individual jobs to be retried or tracked independently.

---

## 3. Asynchronous Job Processing

Email delivery is intentionally removed from the synchronous API request lifecycle.

```text
API Request
     │
     ▼
Create Email Record
     │
     ▼
Create BullMQ Job
     │
     ▼
Return Response
     │
     │
     ▼
Background Worker
     │
     ▼
Process Email
     │
     ├── SENT
     └── FAILED
```

This architecture improves API responsiveness and allows email workloads to scale independently from the web application.

---

## 4. Intelligent Throttling

The worker supports configurable delays between email jobs.

For example:

```text
Email 1
   │
   ├── Delay: configured interval
   ▼
Email 2
   │
   ├── Delay: configured interval
   ▼
Email 3
```

Throttling helps control outbound traffic and provides configurable pacing for campaigns.

---

## 5. Hourly Rate Limiting

Redis is used to maintain distributed sending counters.

Example:

```text
Hourly Limit = 200 emails

0 ─────────────────────────────── 200
              ▲
          Current usage
```

When the configured hourly limit is reached:

* New jobs are not immediately dispatched.
* Jobs are delayed.
* Processing resumes during the next available rate-limit window.

Because the counter is maintained in Redis, rate-limit state is shared across worker instances.

---

## 6. Idempotent Job Processing

The worker is designed to avoid duplicate email dispatches when jobs are retried or workers restart.

Before sending an email, the worker validates the current database state.

```text
BullMQ Job
    │
    ▼
Check Email Status
    │
    ├── SENT → Skip
    │
    └── SCHEDULED → Continue
                         │
                         ▼
                    Send Email
                         │
                         ▼
                    Update Status
```

This provides an additional consistency layer between the queue and persistent database state.

---

## 7. Real-Time Queue Monitoring

Bull Board provides an operational view of BullMQ queues.

It exposes information such as:

* Waiting jobs
* Active jobs
* Delayed jobs
* Completed jobs
* Failed jobs
* Retry state

This makes background-processing issues easier to diagnose during development and testing.

---

## 8. Elasticsearch-Powered Search

Email records are indexed in Elasticsearch to support fast searching across campaign history.

Example searchable attributes include:

```text
Recipient
Subject
Status
Campaign
Timestamp
```

The intended data flow is:

```text
PostgreSQL
     │
     │ Email event
     ▼
Elasticsearch Index
     │
     ▼
Search API
     │
     ▼
Frontend Search UI
```

PostgreSQL remains the source of truth for relational state, while Elasticsearch serves the optimized search workload.

---

## 9. Email Status Tracking

Every email job maintains a lifecycle state.

```text
SCHEDULED
    │
    ▼
PROCESSING
    │
    ├──────────────┐
    ▼              ▼
  SENT           FAILED
```

This state is persisted in PostgreSQL and exposed through the backend API for dashboard monitoring.

---

# Project Structure

```text
reachinbox-assignment/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── services/
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── workers/
│   │   ├── queues/
│   │   └── ...
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   └── ...
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

The application follows a separation-of-concerns model:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Persistence / Queue / Search
```

Background processing is isolated from the HTTP request lifecycle.

---

# Docker Architecture

The entire stack runs through Docker Compose.

### Services

```text
┌──────────────────────────────────────────────┐
│              Docker Network                  │
│                                              │
│  ┌───────────┐      ┌───────────┐            │
│  │ Frontend  │─────▶│  Backend  │            │
│  └───────────┘      └─────┬─────┘            │
│                           │                  │
│        ┌──────────────────┼──────────────┐   │
│        ▼                  ▼              ▼   │
│  ┌───────────┐      ┌───────────┐  ┌─────────┐│
│  │PostgreSQL │      │   Redis   │  │Elastic  ││
│  └───────────┘      └─────┬─────┘  │Search   ││
│                           │         └─────────┘│
│                           ▼                    │
│                     ┌───────────┐              │
│                     │  Worker   │              │
│                     └───────────┘              │
└──────────────────────────────────────────────┘
```

Containers communicate using Docker service names rather than hard-coded host addresses.

Example:

Use the provided environment templates where available:

```text
.env.example
```

---

# Local Development

## Prerequisites

Install:

* Docker
* Docker Compose
* Git

Verify installation:

```bash
docker --version
docker compose version
git --version
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/mrskjha/reachinbox-assignment-sunny.git

cd reachinbox-assignment
```

---

## 2. Configure Environment Variables

Create the required environment files:

```text
frontend/.env.local
backend/.env
```

Use the provided environment templates where available:

```text
.env.example
```

Do not commit credentials or secrets to version control.

---

## 3. Start the Application

Build and start all services:

```bash
docker compose up --build -d
```

Check running containers:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f
```

View backend logs:

```bash
docker compose logs -f backend
```

---

## 4. Initialize Prisma

After the containers are healthy:

```bash
docker compose exec backend npx prisma db push
```

Generate Prisma Client if required:

```bash
docker compose exec backend npx prisma generate
```

---

# Application Endpoints

| Service       | URL                         |
| ------------- | --------------------------- |
| Frontend      | http://localhost:3000       |
| Backend API   | http://localhost:5000       |
| Bull Board    | Backend Bull Board endpoint |
| Elasticsearch | Internal Docker service     |
| PostgreSQL    | Internal Docker service     |
| Redis         | Internal Docker service     |

Database, Redis, and Elasticsearch are intended to be accessed through the internal Docker network rather than directly exposed to the host unless explicitly required.

---

# Operational Commands

### Start

```bash
docker compose up -d
```

### Rebuild

```bash
docker compose up --build -d
```

### Stop

```bash
docker compose down
```

### Stop and remove volumes

```bash
docker compose down -v
```

> `-v` removes persistent Docker volumes and therefore deletes local database data.

### View logs

```bash
docker compose logs -f
```

### Backend shell

```bash
docker compose exec backend sh
```

### Prisma Studio

```bash
docker compose exec backend npx prisma studio
```

---

# Reliability & Engineering Considerations

### Queue-Based Processing

Email execution is handled asynchronously so API latency is not coupled to email-provider latency.

### Idempotency

Database state is checked before processing a job to reduce duplicate sends during retries or worker restarts.

### Rate Limiting

Redis provides shared counters that can be consumed by multiple worker processes.

### Persistence

PostgreSQL maintains durable application state independently of the queue.

### Search Separation

Elasticsearch handles search workloads without turning PostgreSQL into the primary full-text search engine.

### Container Isolation

Each infrastructure component runs independently, making the application easier to reproduce and operate locally.

---

# Failure Handling

The system is designed around explicit job states and background-worker failure scenarios.

```text
                    ┌──────────────┐
                    │ Scheduled Job│
                    └──────┬───────┘
                           ▼
                    ┌──────────────┐
                    │ Worker       │
                    │ Processing   │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        Email Success              Email Failure
              │                         │
              ▼                         ▼
            SENT                    Retry / FAILED
```

Worker crashes do not require the frontend or API process to remain alive for job execution.

---

# Design Decisions

## Why PostgreSQL?

PostgreSQL provides strong transactional guarantees and is well suited for relational entities such as:

* Users
* Campaigns
* Email jobs
* Delivery states
* Timestamps
* Relationships

## Why Redis + BullMQ?

Email sending is an asynchronous workload. BullMQ provides:

* Delayed jobs
* Retry mechanisms
* Job states
* Queue concurrency
* Background processing

Redis provides the underlying fast in-memory data store.

## Why Elasticsearch?

Email history can grow rapidly. Elasticsearch provides an architecture optimized for:

* Full-text search
* Indexed queries
* Filtering
* Large result sets

## Why Docker Compose?

Docker Compose provides a reproducible environment where application and infrastructure services can be started consistently with a single command.

---

# Security Considerations

The application follows several basic security principles:

* OAuth credentials are stored in environment variables.
* Secrets are excluded from source control.
* Authentication is handled through NextAuth.js.
* Backend resources are associated with authenticated users.
* Infrastructure services communicate over the private Docker network.
* Database credentials are not hard-coded into application source code.

For production deployment, additional controls such as secret management, TLS, provider-level authentication, network policies, and structured audit logging should be added.

---

# Scalability

The architecture allows individual components to scale independently.

```text
                 ┌──────────────┐
                 │ Load Balancer│
                 └──────┬───────┘
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
        Backend #1             Backend #2
             │                     │
             └──────────┬──────────┘
                        ▼
                      Redis
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
           Worker 1  Worker 2  Worker 3
```

Additional workers can consume jobs from the same BullMQ queue without requiring changes to the API architecture.

---

# Future Improvements

Potential production extensions include:

* SMTP/provider abstraction
* Provider failover
* Exponential retry backoff
* Dead-letter queues
* Distributed tracing
* Structured application logging
* Prometheus metrics
* Grafana dashboards
* WebSocket/SSE-based live status updates
* Campaign-level analytics
* Email templates
* Bounce and complaint handling
* Webhook-based delivery tracking
* Horizontal worker autoscaling
* Production secret management
* CI/CD pipeline
* Automated integration and end-to-end testing

---

# Engineering Summary

ReachInbox demonstrates a distributed full-stack architecture where:

```text
Next.js
   │
   ▼
Express API
   │
   ├───────────────► PostgreSQL
   │
   ├───────────────► Elasticsearch
   │
   └───────────────► Redis / BullMQ
                           │
                           ▼
                     Background Worker
                           │
                           ▼
                       Email Provider
```

The architecture separates **request handling, persistence, asynchronous execution, rate limiting, and search**, making the platform easier to reason about, test, operate, and scale.

---

## License

This project was developed as part of the **ReachInbox Full-Stack Engineering Assignment**.
