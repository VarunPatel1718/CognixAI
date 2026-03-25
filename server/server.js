import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express'
import aiRouter from "./routes/aiRoutes.js"
import sql from './configs/db.js'
import connectCloudinary from './configs/Cloudinary.js';

const app = express()

await connectCloudinary()

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(clerkMiddleware())

// PUBLIC routes
app.get('/', (req, res) => res.send('Server is Live!'))
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CognixAI server is running', timestamp: new Date() })
})

// PROTECTED routes
app.use('/api/ai', aiRouter)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Server is running on port', PORT);
})