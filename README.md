# VÊTEMENT — AI-Powered Luxury Fashion E-Commerce

> A full-stack, AI-powered fashion e-commerce platform with a **Virtual Try-On** system. Browse a curated luxury catalog, manage your cart, and visualize how any garment looks on *your* body before you buy.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Node](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![MongoDB](https://img.shields.io/badge/MongoDB-6+-darkgreen?logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📑 Table of Contents

- [Features](#-features)
- [Project Structure](#️-project-structure)
- [Tech Stack](#️-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#1-clone--install-dependencies)
  - [Environment Variables](#2-configure-environment-variables)
  - [Seed the Database](#3-seed-the-database)
  - [Run All Services](#4-run-all-three-services)
- [API Reference](#-api-reference)
- [AI Virtual Try-On](#-ai-virtual-try-on)
- [Optional Integrations](#-optional-integrations)
- [Database Schema](#-database-schema)
- [Contributing](#-contributing)

---

## ✨ Features

| Feature | Status |
|---|---|
| Luxury product catalog (Men / Women / Accessories / New Arrivals) | ✅ |
| Product detail page — image gallery, size & color selectors | ✅ |
| Shopping cart with persistent state (Zustand) | ✅ |
| User authentication — JWT (Register / Login / Profile) | ✅ |
| Checkout with shipping address form | ✅ |
| Order history (Account page) | ✅ |
| Admin dashboard — product CRUD & order status management | ✅ |
| AI Virtual Try-On — upload photo → see outfit on you | ✅ |
| Order confirmation emails (Resend-ready stub) | ✅ |
| Stripe-ready payment service (stub) | ✅ |
| Cloudinary image storage | ✅ |
| Database seeding — 12 products + admin account | ✅ |

---

## 🏗️ Project Structure

```
dbmsEcommerceProj/
├── frontend/               # Next.js 14 (App Router) — TypeScript, Tailwind CSS
│   └── src/
│       ├── app/            # Pages & layouts (App Router)
│       ├── components/     # Reusable UI components
│       ├── store/          # Zustand state management
│       ├── lib/            # API client & utilities
│       └── types/          # TypeScript type definitions
│
├── backend/                # Node.js / Express / MongoDB REST API
│   └── src/
│       ├── config/         # DB connection & env config
│       ├── controllers/    # Route handler logic
│       ├── middleware/      # Auth, error handling
│       ├── models/         # Mongoose schemas (User, Product, Order, TryOn)
│       ├── routes/         # API route definitions
│       ├── services/       # Business logic (email, payment, AI)
│       └── utils/          # Helpers & database seed script
│
└── ai-service/             # Python / FastAPI — Virtual Try-On engine
    └── app/
        └── services/       # Image compositing & model runner
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand, Axios |
| **Backend** | Node.js 18, Express 4, MongoDB 6, Mongoose, JWT, Bcrypt |
| **AI Service** | Python 3.11, FastAPI, Pillow, OpenCV, NumPy, Cloudinary SDK |
| **Storage** | Cloudinary (images & try-on results) |
| **Auth** | JSON Web Tokens (JWT) |
| **Email** | Resend (stub — plug-and-play) |
| **Payments** | Stripe (stub — plug-and-play) |

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| Python | 3.11+ |
| MongoDB | 6+ (local or Atlas) |

---

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/<your-username>/dbmsEcommerceProj.git
cd dbmsEcommerceProj

# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install

# AI Service
cd ../ai-service
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
```

---

### 2. Configure Environment Variables

Create the following `.env` files — **never commit real secrets to Git**.

#### `backend/.env`
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/fashiondb
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
AI_SERVICE_URL=http://localhost:8000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
# Optional — uncomment when Resend is active
# RESEND_API_KEY=re_xxxxxxxxxxxx
# FROM_EMAIL=orders@yourdomain.com
# Optional — uncomment when Stripe is active
# STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
```

#### `ai-service/.env`
```env
AI_SERVICE_PORT=8000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

### 3. Seed the Database

```bash
cd backend
npm run seed
```

This creates **12 demo products** and a ready-to-use **admin account**:

| Field | Value |
|---|---|
| Email | `admin@vetement.com` |
| Password | `Admin@12345` |

---

### 4. Run All Three Services

Open **three separate terminals**:

```bash
# Terminal 1 — Frontend  →  http://localhost:3000
cd frontend
npm run dev

# Terminal 2 — Backend   →  http://localhost:5000
cd backend
npm run dev

# Terminal 3 — AI Service  →  http://localhost:8000
cd ai-service
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
uvicorn app.main:app --reload --port 8000
```

---

## 🔌 API Reference

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Create a new user account |
| `POST` | `/login` | Public | Login & receive JWT |
| `GET` | `/me` | 🔒 Protected | Get current user profile |
| `PUT` | `/profile` | 🔒 Protected | Update profile details |

### Products — `/api/products`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Public | List all products (supports filtering) |
| `GET` | `/:id` | Public | Get single product |
| `POST` | `/` | 👑 Admin | Create a new product |
| `PUT` | `/:id` | 👑 Admin | Update a product |
| `DELETE` | `/:id` | 👑 Admin | Delete a product |

### Orders — `/api/orders`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/` | 🔒 Protected | Place a new order |
| `GET` | `/my-orders` | 🔒 Protected | Get current user's orders |
| `GET` | `/admin/all` | 👑 Admin | Get all orders |
| `PATCH` | `/:id/status` | 👑 Admin | Update order status |

### AI Try-On — `/api/ai`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/tryon` | 🔒 Protected | Submit try-on (garment + user photo) |
| `GET` | `/my-tryons` | 🔒 Protected | Retrieve past try-on results |

---

## 🧠 AI Virtual Try-On

The try-on pipeline runs in three steps:

1. **Select a garment** from the product catalog
2. **Upload a full-body photo** of yourself
3. **AI composites** the garment onto your photo

**Current engine:** PIL / OpenCV compositing — runs on CPU, no GPU required.  
**To upgrade to a diffusion model:** swap `ai-service/app/services/model_runner.py` with an OOTDiffusion or IDM-VTON inference script when a GPU instance is available.

For a detailed breakdown of the system architecture and implementation strategy, see the [Architecture and Implementation Documentation](docs/architecture.md).

---

## ⚡ Optional Integrations

### Stripe Payments

1. `npm install stripe` inside `backend/`
2. Add `STRIPE_SECRET_KEY=sk_test_...` to `backend/.env`
3. Uncomment the Stripe logic in `backend/src/services/payment.service.js`

### Resend Transactional Email

1. `npm install resend` inside `backend/`
2. Add `RESEND_API_KEY` and `FROM_EMAIL` to `backend/.env`
3. Uncomment the Resend logic in `backend/src/services/email.service.js`

---

## 🗄️ Database Schema

```
User       → name, email, passwordHash, role (user | admin), addresses[]
Product    → name, description, price, category, images[], sizes[], colors[], stock
Order      → user, items[], shippingAddress, totalPrice, status, paymentStatus
TryOn      → user, productId, userImageUrl, resultImageUrl, createdAt
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

> Built as a DBMS course project — demonstrating full-stack development with REST APIs, JWT auth, relational-style MongoDB schemas, and an AI microservice.
