# VÊTEMENT — Luxury Fashion E-Commerce Platform

> A full-stack luxury fashion e-commerce platform crafted with modern minimalism, performance, and reliability. Browse a curated catalog, manage your cart, experience seamless checkout with Stripe, and track your orders.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Node](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
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
  - [Run Both Services](#4-run-both-services)
- [API Reference](#-api-reference)
- [Optional Integrations](#-optional-integrations)
- [Database Schema](#-database-schema)
- [Contributing](#-contributing)

---

## ✨ Features

| Feature | Status |
|---|---|
| Luxury product catalog (Men / Women / Accessories / New Arrivals) | ✅ |
| Product detail page — image gallery, size & color selectors, stock awareness | ✅ |
| Shopping cart with persistent state (Zustand) | ✅ |
| User authentication — JWT (Register / Login / Profile) | ✅ |
| Checkout with shipping address form & Stripe card integration | ✅ |
| Customer order history (Account page) | ✅ |
| Admin dashboard — product inventory CRUD & order status fulfillment | ✅ |
| Order confirmation & welcome emails (Resend-ready) | ✅ |
| Stripe payment processing & webhook verification | ✅ |
| Cloudinary image storage with direct stream uploads | ✅ |
| Database seeding — 12 luxury products + ready admin account | ✅ |

---

## 🏗️ Project Structure

```
dbmsEcommerceProj/
├── frontend/               # Next.js 14 (App Router) — TypeScript, Tailwind CSS
│   └── src/
│       ├── app/            # Pages & layouts (Storefront, Cart, Checkout, Admin, Account)
│       ├── components/     # Reusable UI components (Navbar, ProductCard, AdminForm, etc.)
│       ├── store/          # Zustand client-side stores (Cart, Auth)
│       ├── lib/            # REST API client & auth helpers
│       └── types/          # TypeScript domain models & interfaces
│
├── backend/                # Node.js / Express / MongoDB REST API
│   └── src/
│       ├── config/         # MongoDB connection & Cloudinary setup
│       ├── controllers/    # Route controllers (Auth, Products, Orders)
│       ├── middleware/     # JWT authentication, error handler, Multer upload
│       ├── models/         # Mongoose schemas (User, Product, Order)
│       ├── routes/         # Express routers
│       ├── services/       # Email & payment services
│       └── utils/          # Seed data script & email templates
│
└── docs/                   # Architecture and system documentation
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand, Axios |
| **Backend** | Node.js 18+, Express 4, MongoDB 6+, Mongoose, JWT, Bcrypt |
| **Storage** | Cloudinary CDN |
| **Auth** | JSON Web Tokens (JWT) & HTTP-only secure patterns |
| **Email** | Resend (transactional email stub) |
| **Payments** | Stripe Elements & Payment Intents API |

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| MongoDB | 6+ (local instance or MongoDB Atlas) |

---

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/sudeepshm/dbmsProject.git
cd dbmsProject

# Frontend dependencies
cd frontend && npm install

# Backend dependencies
cd ../backend && npm install
```

---

### 2. Configure Environment Variables

#### `backend/.env`
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/fashiondb
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Stripe Payments (optional)
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Resend Transactional Email (optional)
RESEND_API_KEY=re_your_key
FROM_EMAIL=onboarding@resend.dev
```

#### `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

---

### 3. Seed the Database

```bash
cd backend
npm run seed
```

This populates **12 luxury products** and creates the default **admin account**:

| Credential | Value |
|---|---|
| **Email** | `admin@vetement.com` |
| **Password** | `Admin@12345` |

---

### 4. Run Both Services

Open **two separate terminals**:

```bash
# Terminal 1 — Frontend  →  http://localhost:3000
cd frontend
npm run dev

# Terminal 2 — Backend   →  http://localhost:5000
cd backend
npm run dev
```

---

## 🔌 API Reference

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register a new user |
| `POST` | `/login` | Public | Authenticate user & return JWT |
| `GET` | `/me` | 🔒 Protected | Fetch current profile |
| `PUT` | `/profile` | 🔒 Protected | Update profile details |

### Products — `/api/products`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Public | List products (category, price filter, sort, search) |
| `GET` | `/:id` | Public | Fetch product details by ID |
| `POST` | `/` | 👑 Admin | Create a product with image upload |
| `PUT` | `/:id` | 👑 Admin | Update product details |
| `DELETE` | `/:id` | 👑 Admin | Delete product |

### Orders — `/api/orders`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/` | 🔒 Protected | Place order & create Stripe PaymentIntent |
| `POST` | `/:id/confirm-payment` | 🔒 Protected | Confirm payment status |
| `GET` | `/my-orders` | 🔒 Protected | Get current user's order history |
| `GET` | `/admin/all` | 👑 Admin | Get all store orders |
| `PATCH` | `/:id/status` | 👑 Admin | Update fulfillment status |

### Webhooks — `/api/webhooks`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/stripe` | Verifies raw-buffer Stripe payment webhook signatures |

---

## ⚡ Optional Integrations

### Stripe Payments
1. Add `STRIPE_SECRET_KEY` in `backend/.env`.
2. Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `frontend/.env.local`.
3. Start the Stripe listener for webhooks:
   ```bash
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   ```

### Resend Transactional Email
1. Add `RESEND_API_KEY` and `FROM_EMAIL` to `backend/.env`.
2. Automatic branded order confirmation and welcome emails will be dispatched on order creation and registration.

---

## 🗄️ Database Schema

```
User       → name, email, passwordHash, role (user | admin), avatar, timestamps
Product    → name, description, price, originalPrice, category, images[], sizes[], colors[], stock, inStock, rating
Order      → user, items[], shippingAddress, subtotal, shippingCost, total, status, paymentStatus
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
