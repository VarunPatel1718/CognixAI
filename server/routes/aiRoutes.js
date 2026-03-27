import express from "express";
import { auth, requireFeature } from "../middlewares/auth.js";
import { generateArticle, generateBlogTitle, generateImage, reviewResume, removeBackground, removeObject, generateCode, chatWithAI, getUserCreations, getPublishedCreations, toggleLike } from "../controllers/aiController.js";

const aiRouter = express.Router();

aiRouter.post('/generate-article', auth, requireFeature('article_generation'), generateArticle)
aiRouter.post('/generate-blog-title', auth, requireFeature('title_generation'), generateBlogTitle)
aiRouter.post('/generate-image', auth, requireFeature('generate_images'), generateImage)
aiRouter.post('/review-resume', 
  (req, res, next) => { console.log('Step 1: auth'); next(); },
  auth,
  (req, res, next) => { console.log('Step 2: featureCheck'); next(); },
  requireFeature('resume_review'),
  (req, res, next) => { console.log('Step 3: controller'); next(); },
  reviewResume
)
aiRouter.post('/remove-background', auth, requireFeature('remove_background'), removeBackground)
aiRouter.post('/remove-object', auth, requireFeature('remove_object'), removeObject)
aiRouter.post('/generate-code', auth, generateCode)
aiRouter.post('/chat', auth, chatWithAI)
aiRouter.get('/get-user-creations', auth, getUserCreations)
aiRouter.get('/get-published-creations', getPublishedCreations)
aiRouter.post('/toggle-like', auth, toggleLike)


export default aiRouter
