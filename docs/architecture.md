# Architecture and Implementation Documentation: VÊTEMENT Luxury E-Commerce Platform

## 1. System Overview
**VÊTEMENT** is a full-stack luxury fashion e-commerce platform designed with performance, reliability, and modern minimalism. The application provides an elegant shopping experience for curated fashion collections, seamless user authentication, shopping cart management, Stripe checkout integration, and an administrative management dashboard.

---

## 2. Core Stakeholder Requirements

* **Customers (Shoppers):**
  * **Fast & Responsive Browsing:** Instant catalog loading with category, price, and size filters.
  * **Seamless Checkout:** Simple shipping details entry with secure Stripe card payments.
  * **Order Tracking:** Accessible purchase history with order statuses (Pending, Processing, Shipped, Delivered).

* **Store Administrators:**
  * **Product Inventory Management:** Add, edit, and delete products, including image uploads to Cloudinary.
  * **Order Fulfillment:** Real-time visibility into all customer orders with status updates.

* **Engineering & Operations:**
  * **Simplicity & Maintainability:** Decoupled frontend and backend REST architecture.
  * **Data Integrity:** Strict Mongoose schemas with indexed querying for categories and search.
  * **Security:** JWT authentication, bcrypt password hashing, HTTP security headers via Helmet, and strict CORS policies.

---

## 3. High-Level Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 14 Frontend                  │
│       React 18 · TypeScript · Tailwind CSS · Zustand    │
└────────────────────────────┬────────────────────────────┘
                             │ REST API (JSON / Multipart)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                  Express.js / Node.js Backend           │
│      JWT Auth · Helmet · Cors · Multer · Stripe SDK     │
└──────────────┬───────────────────────────┬──────────────┘
               │                           │
               ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│     MongoDB (Mongoose)    │ │    Cloudinary CDN         │
│  Users · Products · Orders│ │    Product Media Storage  │
└───────────────────────────┘ └───────────────────────────┘
```

| Layer | Technology | Responsibilities |
|---|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Zustand | Luxury UI, client-side cart & auth state, server-side page rendering |
| **Backend API** | Node.js 18+, Express 4, Mongoose 8 | REST endpoints, business validation, JWT verification, Stripe integration |
| **Database** | MongoDB 6+ | Structured collections for Users, Products, and Orders |
| **Media Storage**| Cloudinary CDN | High-performance image hosting for product collections |
| **Payments** | Stripe | Payment Intents and webhook event handling |
| **Email** | Resend | Branded order confirmation and welcome emails |

---

## 4. Database Models & Schema Design

### 1. User (`User.js`)
* `name`: String (required, max 60 chars)
* `email`: String (required, unique, validated email format)
* `password`: String (required, hashed via bcrypt salt 10, excluded from JSON queries)
* `role`: Enum `["user", "admin"]` (default `"user"`)
* `avatar`: String (optional URL)
* `timestamps`: `createdAt`, `updatedAt`

### 2. Product (`Product.js`)
* `name`: String (required, indexed for search)
* `description`: String (required)
* `price`: Number (required, min 0)
* `originalPrice`: Number (optional for discount display)
* `image`: String (primary image URL)
* `images`: String[] (gallery image URLs)
* `category`: Enum `["men", "women", "new", "accessories"]`
* `sizes`: String[] (e.g. `["S", "M", "L", "XL"]`)
* `colors`: Array of `{ name: string, hex: string }`
* `rating`: Number (0-5)
* `reviewCount`: Number
* `stock`: Number (default 50)
* `inStock`: Boolean
* `tags`: String[]
* **Indexes:** Compound index on `{ category: 1, price: 1 }` and text index on `{ name, description, tags }`.

### 3. Order (`Order.js`)
* `user`: ObjectId (ref: `User`)
* `items`: Array of:
  * `product`: ObjectId (ref: `Product`)
  * `size`: String
  * `color`: String
  * `quantity`: Number (min 1)
  * `price`: Number
* `shippingAddress`: Object (`fullName`, `address`, `city`, `state`, `zipCode`, `country`, `phone`)
* `subtotal`: Number
* `shippingCost`: Number
* `total`: Number
* `status`: Enum `["pending", "processing", "shipped", "delivered", "cancelled"]`
* `paymentStatus`: Enum `["pending", "paid", "failed"]`
* `stripePaymentIntentId`: String
* `timestamps`: `createdAt`, `updatedAt`

---

## 5. API Reference & Data Flow

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Create account with password hashing, returns JWT & user profile.
* `POST /api/auth/login` — Authenticate credentials, returns JWT.
* `GET /api/auth/me` — Protected; returns authenticated user profile.
* `PUT /api/auth/profile` — Protected; update account details.

### Products (`/api/products`)
* `GET /api/products` — Public; supports filtering by category, price bounds, sorting, and pagination.
* `GET /api/products/:id` — Public; returns single product details.
* `POST /api/products` — Admin protected; handles multipart image upload via Multer to Cloudinary and saves product.
* `PUT /api/products/:id` — Admin protected; updates product attributes and optional new images.
* `DELETE /api/products/:id` — Admin protected; removes product from inventory.

### Orders (`/api/orders`)
* `POST /api/orders` — Protected; validates inventory, creates order, and initializes Stripe PaymentIntent.
* `POST /api/orders/:id/confirm-payment` — Protected; marks order as paid upon successful client confirmation.
* `GET /api/orders/my-orders` — Protected; fetches current user's order history.
* `GET /api/orders/admin/all` — Admin protected; fetches all customer orders for fulfillment.
* `PATCH /api/orders/:id/status` — Admin protected; updates delivery status.

### Webhooks (`/api/webhooks`)
* `POST /api/webhooks/stripe` — Receives Stripe events (e.g. `payment_intent.succeeded`) with raw Buffer signature validation.

---

## 6. Performance & Security Safeguards
* **Zero-Disk-Footprint Uploads:** Images are held in memory buffers and streamed directly to Cloudinary.
* **Database Indexing:** Compound indexes on catalog queries ensure $O(\log N)$ filter execution times.
* **Client-Side Optimization:** Next.js Image component handles automatic image optimization, responsive sizing, and modern WebP/AVIF formats.
