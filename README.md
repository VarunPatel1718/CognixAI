# 🤖 CognixAI

> AI-powered SaaS platform for content creation

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://choosealicense.com/licenses/mit/)

## � Live Demo

**Live Demo:** https://cognixai-saas.vercel.app  
**Backend API:** https://cognixai-backend-sbs5.onrender.com  
**GitHub:** https://github.com/VarunPatel1718/CognixAI

## �📋 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Environment Variables](#️-environment-variables)
- [🔒 Security](#-security)
- [💻 How to Run Locally](#-how-to-run-locally)
- [📡 API Endpoints](#-api-endpoints)
- [🌐 Deployment Guide](#-deployment-guide)
- [📸 Screenshots](#-screenshots)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👨‍💻 Author](#-author)

## ✨ Features

- 📝 **Article Generator** - AI-powered article creation using Google Gemini
- 📰 **Blog Title Generator** - Generate catchy blog titles with Gemini AI
- 💻 **AI Code Generator** - Generate code in 9 programming languages using Groq Llama
- 🎨 **Image Generator** - Create stunning images with Stability AI and Hugging Face FLUX
- 🖼️ **Background Remover** - Remove backgrounds from images using Remove.bg API
- 📋 **Resume Analyzer** - Upload PDF resumes and get ATS scoring and analysis
- 💬 **AI Chat Assistant** - Interactive chat powered by Groq Llama
- 🌍 **Community** - Share and like AI-generated images
- 📊 **Dashboard** - Track usage and manage your creations
- 🌓 **Dark/Light Mode** - Toggle between themes for comfortable viewing

## 🛠️ Tech Stack

| Technology             | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| **Frontend**           | React 18 with Vite for fast development              |
| **Backend**            | Express.js with Node.js for server-side logic        |
| **Database**           | PostgreSQL (Neon) for scalable data storage          |
| **Authentication**     | Clerk for secure user management                     |
| **AI Services**        | Google Gemini, Groq (Llama 3.1) for text generation  |
| **Image AI**           | Stability AI, Hugging Face FLUX for image generation |
| **Background Removal** | Remove.bg API for image processing                   |
| **Storage**            | Cloudinary for media storage and CDN                 |
| **Styling**            | TailwindCSS for responsive design                    |
| **Deployment**         | Vercel (frontend) + Render (backend)                 |

## 📁 Project Structure

```
CognixAI/
├── client/                 # React Vite frontend
│   ├── src/
│   │   ├── assets/         # Static assets
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── App.jsx         # Main App component
│   │   └── main.jsx        # Entry point
│   └── .env               # Frontend environment variables
├── server/                 # Express.js backend
│   ├── configs/           # Database and Cloudinary configuration
│   ├── controllers/       # Business logic and API handlers
│   ├── middlewares/       # Authentication and validation middleware
│   ├── routes/           # API route definitions
│   └── .env              # Backend environment variables (KEEP SECRET)
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn** package manager
- **Neon PostgreSQL** account
- **Clerk** account for authentication
- **Google AI Studio** account (Gemini API)
- **Groq** account for Llama API
- **Stability AI** account for image generation
- **Hugging Face** account for FLUX model
- **Remove.bg** account for background removal
- **Cloudinary** account for media storage

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/VarunPatel1718/CognixAI.git
   cd CognixAI
   ```

2. **Install backend dependencies**

   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables** (see below)

5. **Run the application** (see [How to Run Locally](#how-to-run-locally))

## ⚙️ Environment Variables

### SERVER (server/.env)

| Variable                | Description                          | Required |
| ----------------------- | ------------------------------------ | -------- |
| `DATABASE_URL`          | Neon PostgreSQL connection URL       | Yes      |
| `CLERK_PUBLISHABLE_KEY` | Clerk public key                     | Yes      |
| `CLERK_SECRET_KEY`      | Clerk secret key ⚠️ **PRIVATE**      | Yes      |
| `GEMINI_API_KEY`        | Google Gemini API key ⚠️ **PRIVATE** | Yes      |
| `GROQ_API_KEY`          | Groq AI API key ⚠️ **PRIVATE**       | Yes      |
| `STABILITY_API_KEY`     | Stability AI API key ⚠️ **PRIVATE**  | Yes      |
| `HUGGINGFACE_API_KEY`   | HuggingFace API key ⚠️ **PRIVATE**   | Yes      |
| `REMOVEBG_API_KEY`      | Remove.bg API key ⚠️ **PRIVATE**     | Yes      |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                | Yes      |
| `CLOUDINARY_API_KEY`    | Cloudinary API key ⚠️ **PRIVATE**    | Yes      |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret ⚠️ **PRIVATE** | Yes      |

### CLIENT (client/.env)

| Variable                     | Description      | Required |
| ---------------------------- | ---------------- | -------- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk public key | Yes      |

## 🔒 Security

⚠️ **IMPORTANT SECURITY RULES:**

- **NEVER** commit `.env` files to GitHub
- **NEVER** share API keys publicly
- **NEVER** paste API keys in chat or messages
- **ALWAYS** add `.env` to `.gitignore`
- **ROTATE** keys immediately if accidentally exposed
- **USE** environment variables in production

Your API keys are valuable assets. Protect them carefully!

## 💻 How to Run Locally

1. **Start the backend server**

   ```bash
   cd server
   npm start
   ```

   The server will run on `http://localhost:3000`

2. **Start the frontend development server**

   ```bash
   cd client
   npm run dev
   ```

   The frontend will run on `http://localhost:5173`

3. **Access the application**
   - Open your browser and navigate to `http://localhost:5173`
   - Sign up or log in using Clerk authentication
   - Start exploring the AI features!

## 📡 API Endpoints

| Method | Path                              | Authentication | Description                         |
| ------ | --------------------------------- | -------------- | ----------------------------------- |
| `POST` | `/api/ai/generate-article`        | Required       | Generate articles using Gemini AI   |
| `POST` | `/api/ai/generate-blog-title`     | Required       | Generate blog titles                |
| `POST` | `/api/ai/generate-code`           | Required       | Generate code in multiple languages |
| `POST` | `/api/ai/generate-image`          | Required       | Generate images using AI            |
| `POST` | `/api/ai/remove-background`       | Required       | Remove image backgrounds            |
| `POST` | `/api/ai/review-resume`           | Required       | Analyze and score resumes           |
| `POST` | `/api/ai/chat-with-ai`            | Required       | Chat with AI assistant              |
| `GET`  | `/api/ai/get-published-creations` | Optional       | Get community creations             |
| `POST` | `/api/ai/toggle-like`             | Required       | Like/unlike creations               |
| `GET`  | `/api/ai/get-user-creations`      | Required       | Get user's creations                |

## 🌐 Deployment Guide

### Frontend Deployment (Vercel)

1. **Create Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)
   - Connect your GitHub repository

2. **Configure Vercel**

   ```bash
   # In Vercel dashboard:
   # 1. Import your GitHub repository
   # 2. Set root directory to "client"
   # 3. Add environment variables from client/.env
   # 4. Deploy!
   ```

3. **Environment Variables in Vercel**
   - Go to Project Settings → Environment Variables
   - Add `VITE_CLERK_PUBLISHABLE_KEY`

### Backend Deployment (Render)

1. **Create Render Account**
   - Sign up at [render.com](https://render.com)
   - Connect your GitHub repository

2. **Configure Render**

   ```bash
   # In Render dashboard:
   # 1. Create new "Web Service"
   # 2. Connect your GitHub repository
   # 3. Set root directory to "server"
   # 4. Set build command: "npm install"
   # 5. Set start command: "npm start"
   # 6. Add all server environment variables
   # 7. Deploy!
   ```

3. **Environment Variables in Render**
   - Go to Service Settings → Environment
   - Add all variables from server/.env
   - **IMPORTANT**: Never add `.env` files to your repo!

4. **Update Frontend API URL**
   - In `client/.env`, update:
     ```
     VITE_API_URL=https://your-backend-url.onrender.com
     ```

## 📸 Screenshots

### 🏠 Dashboard

_Track your AI usage and manage your creations_

### 📝 Article Generator

_Create high-quality articles with AI assistance_

### 💻 Code Generator

_Generate code in 9 different programming languages_

### 🎨 Image Generator

_Create stunning images with AI_

### 🖼️ Background Remover

_Remove backgrounds from images instantly_

### 📋 Resume Analyzer

_Get ATS scoring and detailed resume analysis_

### 💬 AI Chat

_Interactive AI assistant for all your questions_

### 🌍 Community

_Share and discover AI-generated content_

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Guidelines

- Follow the existing code style
- Add comments for complex logic
- Update documentation as needed
- Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Varun Patel**

- GitHub: [https://github.com/VarunPatel1718](https://github.com/VarunPatel1718)
- LinkedIn: [https://linkedin.com/in/varunpatel1718](https://linkedin.com/in/varunpatel1718)

---

⭐ **Star this repository if it helped you!**

🚀 **Built with ❤️ using modern web technologies**
"# trigger"
