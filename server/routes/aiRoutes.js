import express from "express";
import { auth } from "../middlewares/auth.js";
import { generateArticle, generateBlogTitle, generateImage, reviewResume, removeBackground, removeObject, getUserCreations, getPublishedCreations, toggleLike } from "../controllers/aiController.js";

const aiRouter = express.Router();

aiRouter.post('/generate-article', auth, generateArticle)
aiRouter.post('/generate-blog-title', auth, generateBlogTitle)
aiRouter.post('/generate-image', auth, generateImage)
aiRouter.post('/review-resume', auth, reviewResume)
aiRouter.post('/remove-background', auth, removeBackground)
aiRouter.post('/remove-object', auth, removeObject)
aiRouter.get('/get-user-creations', auth, getUserCreations)
aiRouter.get('/get-published-creations', getPublishedCreations)
aiRouter.post('/toggle-like', auth, toggleLike)


export default aiRouter
