# CognixAI

🚀 **AI-powered SaaS platform for content creation**

---

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-5.x-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38BDF8?logo=tailwindcss&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-Auth-000000?logo=clerk&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-FF6C37?logo=cloudinary&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)

---

## 📌 Table of Contents

1. ✨ Features
2. 🧰 Tech Stack
3. 📁 Project Structure
4. 🚀 Getting Started
   1. Prerequisites
   2. Installation
   3. Environment Variables
   4. Run Locally
5. 🔌 API Endpoints
6. 🖼️ Screenshots
7. 🌐 Live Demo
8. 🤝 Contributing
9. 📝 License
10. 👤 Author

---

## ✨ Features

- 🔐 **User Authentication** — Secure sign-in/sign-up via Clerk
- 📝 **Article Generator** — Generate full articles using AI
- 💡 **Blog Title Generator** — Create creative titles in seconds
- 🖼️ **Image Generator** — AI-powered image generation using Stability AI SDXL model
- 🧼 **Background Remover** — Remove image backgrounds using Remove.bg API (50 free credits/month)
- 🧩 **Object Remover** — Remove objects from images using AI
- 📄 **Resume Analyzer** — Upload a PDF resume and get expert feedback using Gemini AI
- 👥 **Community** — Share and explore AI creations
- 💳 **Subscription Plans** — Free and Premium tiers via Clerk Billing

---

## 🧰 Tech Stack

| Category   | Technology                                   | What it does                                         |
| ---------- | -------------------------------------------- | ---------------------------------------------------- |
| Database   | **Neon (Serverless PostgreSQL)**             | Stores user creations and metadata                   |
| Backend    | **Express.js** + **Node.js**                 | REST API endpoints + business logic                  |
| Frontend   | **React (Vite)**                             | UI + client-side rendering                           |
| Auth       | **Clerk**                                    | Authentication, session handling, billing/tier logic |
| AI         | **Google Gemini API**                        | Generate articles, titles, and resume reviews        |
| Media      | **Cloudinary**                               | Uploads + transforms images                          |
| Deployment | **Vercel (frontend)** + **Render (backend)** | Production hosting                                   |

---

## 📁 Project Structure

```text
CognixAI/
  client/
    src/
    .env
  server/
    configs/
    controllers/
    middlewares/
    routes/
    .env
  .gitignore
  package.json (optional, depending on workspace setup)
  README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm (or pnpm/yarn)
- A Neon PostgreSQL database
- Clerk application + keys
- Google Gemini API key
- Cloudinary account + credentials

---

### Installation

1. Clone the repo

```bash
git clone https://github.com/VarunPatel1718/CognixAI.git
cd CognixAI
```

2. Install dependencies

```bash
cd client
npm install

cd ../server
npm install
```

---

### Environment Variables

#### Server (`server/.env`)

Create `server/.env` with the following:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require&channel_binding=require
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
GEMINI_API_KEY=AIza...
REMOVEBG_API_KEY=...
STABILITY_API_KEY=...
HUGGINGFACE_API_KEY=...

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

> Tip: keep `.env` **out of git** (this repo includes `.gitignore`).

#### Client (`client/.env`)

Create `client/.env` with:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

---

### How to Run Locally

1. Start the backend

```bash
cd server
npm run start
```

2. Start the frontend

```bash
cd client
npm run dev
```

3. Open the frontend URL shown by Vite (usually `http://localhost:5173`)

---

## 🌌 API Endpoints

Base URL: `http://localhost:3000`

| Method | Endpoint                          | Auth   | Body                                          | Success Response                     |
| ------ | --------------------------------- | ------ | --------------------------------------------- | ------------------------------------ |
| GET    | `/api/health`                     | Public | —                                             | `{ status, message, timestamp }`     |
| POST   | `/api/ai/generate-article`        | Clerk  | `{ prompt: string, length: number }`          | `{ success: true, content: string }` |
| POST   | `/api/ai/generate-blog-title`     | Clerk  | `{ prompt: string }`                          | `{ success: true, content: string }` |
| POST   | `/api/ai/generate-image`          | Clerk  | `{ prompt: string, publish?: boolean }`       | `{ success: true, content: string }` |
| POST   | `/api/ai/remove-background`       | Clerk  | `{ imageBase64: string }`                     | `{ success: true, content: string }` |
| POST   | `/api/ai/remove-object`           | Clerk  | `{ imageBase64: string, objectName: string }` | `{ success: true, content: string }` |
| POST   | `/api/ai/review-resume`           | Clerk  | `{ resumeText: string }`                      | `{ success: true, content: string }` |
| GET    | `/api/ai/get-user-creations`      | Clerk  | —                                             | `{ success: true, data: array }`     |
| GET    | `/api/ai/get-published-creations` | Public | —                                             | `{ success: true, data: array }`     |
| POST   | `/api/ai/toggle-like`             | Clerk  | `{ creationId: string }`                      | `{ success: true, likes: array }`    |

### Required Auth Header

- `Authorization: Bearer <Clerk token>`
- `Content-Type: application/json` (for POST JSON bodies)

---

## 🖼️ Screenshots

> Place your real screenshots here. Until then:

- Screenshot 1: _Add image / UI overview_
- Screenshot 2: _Add image / AI generation flow_
- Screenshot 3: _Add image / Resume analyzer results_

---

## 🌐 Live Demo

🔗 **Coming Soon - Deploying on Vercel + Render**

---

## 🤝 Contributing

Contributions are welcome!  
If you find a bug or want to add a feature:

1. Fork the repo
2. Create a feature branch
3. Submit a PR

Please ensure changes are well-tested and documented.

---

## 📝 License

MIT License. See `LICENSE` (or add one if you prefer).

---

## 👤 Author

- GitHub: https://github.com/VarunPatel1718
