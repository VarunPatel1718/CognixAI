import express from "express";
import { auth } from "../middlewares/auth.js";
import { generateArticle, generateBlogTitle, generateImage, reviewResume, removeBackground, getUserCreations } from "../controllers/aiController.js";

const aiRouter = express.Router();

aiRouter.post('/generate-article', auth, generateArticle)
aiRouter.post('/generate-blog-title', auth, generateBlogTitle)
aiRouter.post('/generate-image', auth, generateImage)
aiRouter.post('/review-resume', auth, reviewResume)
aiRouter.post('/remove-background', auth, removeBackground)
aiRouter.get('/get-user-creations', auth, getUserCreations)


export default aiRouter
