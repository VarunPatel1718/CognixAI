import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from 'groq-sdk';
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import { Readable } from "stream";

// Configure Cloudinary V2 immediately after import
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Groq AI
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generateArticle = async (req, res) => {
  try {
    const auth = req.auth();
    const { userId } = auth;
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: length,
    });

    const content = response.choices[0].message.content;
    await sql` INSERT INTO creations (user_id, prompt, content, type)
    VALUES (${userId}, ${prompt}, ${content}, 'article')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    res.json({ success: true, content });
  }  catch (error) {
    console.log(error.message)
    if (error.message.includes('429') || error.status === 429) {
      return res.json({
        success: false,
        message: "AI service is busy. Please wait 1-2 minutes and try again."
      })
    }
    res.json({ success: false, message: error.message })
  }
};

export const generateBlogTitle = async (req, res) => {
  try {
    const auth = req.auth();
    const { userId } = auth;
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    await sql` INSERT INTO creations (user_id, prompt, content, type)
    VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.log('Blog title generation error:', error.message);
    console.log('Error status:', error.status);
    console.log('Error details:', error.response?.data);
    
    // Handle 429 rate limit errors specifically
    if (error.message.includes('429') || error.status === 429) {
      return res.json({
        success: false,
        message: "AI service is busy. Please wait 1-2 minutes and try again."
      });
    }
    
    res.json({ success: false, message: error.message });
  }
};

export const reviewResume = async (req, res) => {
  console.log('=== RESUME REVIEW CONTROLLER DEBUG ===');
  console.log('Resume controller started');
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Request files:', req.files);
  console.log('Request file:', req.file);
  console.log('Request body:', req.body);
  
  try {
    const auth = req.auth();
    console.log('Auth object:', auth);
    
    const { userId } = auth;
    const { resumeText } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    console.log('Extracted data - userId:', userId);
    console.log('Extracted data - plan:', plan);
    console.log('Extracted data - free_usage:', free_usage);
    console.log('Extracted data - resumeText length:', resumeText?.length || 'undefined');
    console.log('Extracted data - resumeText preview:', resumeText?.substring(0, 100) + '...' || 'undefined');

    if (!resumeText) {
      console.log('❌ Missing resumeText - returning 400');
      return res.status(400).json({
        success: false,
        message: "Resume text is required.",
      });
    }

    console.log('Checking usage limits...');
    console.log('Plan check - plan:', plan);
    console.log('Plan check - free_usage:', free_usage);
    console.log('Plan check - condition:', plan !== "premium" && free_usage >= 10);

    if (plan !== "premium" && free_usage >= 10) {
      console.log('❌ Usage limit exceeded - returning limit message');
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    console.log('✅ Usage limits passed - calling Groq AI...');
    console.log('API Key exists:', !!process.env.GROQ_API_KEY);
    console.log('API Key length:', process.env.GROQ_API_KEY?.length);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: `You are an expert resume reviewer. Analyze the following resume and return ONLY a valid JSON object with exactly these three keys:

{
  "strengths": "detailed paragraph about what is candidate does well, strong points, impressive aspects of resume",
  
  "areasForImprovement": "detailed paragraph about weaknesses, gaps, things that need to be fixed or improved",
  
  "keywordSuggestions": "detailed paragraph listing specific keywords, skills, and buzzwords that candidate should add to pass ATS systems and match job descriptions"
}

Return ONLY the JSON, no markdown, no extra text.

Resume:
${resumeText}`
        }
      ],
      max_tokens: 1500,
    });

    const content = completion.choices[0].message.content;
    const parsed = JSON.parse(content);

    console.log('✅ Groq AI response received');
    console.log('Response content length:', content?.length || 0);
    console.log('Response content preview:', content?.substring(0, 200) + '...' || 'undefined');

    console.log('Saving to database...');
    await sql` INSERT INTO creations (user_id, prompt, content, type)
    VALUES (${userId}, ${resumeText}, ${content}, 'resume-review')`;
    console.log('✅ Database save complete');

    if (plan !== "premium") {
      console.log('Updating usage metadata for free user...');
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
      console.log('✅ Usage metadata updated');
    }

    console.log('✅ Resume review completed successfully');
    res.json({ 
      success: true, 
      content: {
        strengths: parsed.strengths,
        areasForImprovement: parsed.areasForImprovement,
        keywordSuggestions: parsed.keywordSuggestions
      }
    });
  } catch (error) {
    console.log('❌ RESUME REVIEW ERROR:');
    console.log('Error message:', error.message);
    console.log('Error status:', error.response?.status);
    console.log('Error data:', error.response?.data);
    console.log('Full error object:', error);
    console.log('Error stack:', error.stack);
    
    // Check if this is a 403 error being swallowed
    if (error.response?.status === 403) {
      console.log('❌ 403 ERROR DETECTED IN CATCH BLOCK');
      console.log('403 Error Details:', error.response?.data);
      return res.status(403).json({
        success: false,
        message: "API authentication failed during resume review."
      });
    }
    
    res.json({ success: false, message: error.message });
  }
};

export const generateImage = async (req, res) => {
  try {
    const auth = req.auth();
    const { userId } = auth;
    const { prompt, publish } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    console.log("=== IMAGE GENERATION DEBUG ===");
    console.log("Request Body:", { prompt, publish, userId, plan });
    console.log("Auth Object:", auth);

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required.",
      });
    }

    // Check if Hugging Face API key exists
    if (!process.env.HUGGINGFACE_API_KEY) {
      console.error("❌ HUGGINGFACE_API_KEY is missing from environment");
      return res.status(500).json({
        success: false,
        message: "Server configuration error: API key missing.",
      });
    }

    console.log(
      "✅ Hugging Face API Key exists:",
      !!process.env.HUGGINGFACE_API_KEY,
    );
    console.log(
      "✅ API Key first 10 chars:",
      process.env.HUGGINGFACE_API_KEY?.substring(0, 10),
    );
    console.log("✅ API Key length:", process.env.HUGGINGFACE_API_KEY?.length);

    // Call Hugging Face FLUX API
    console.log("🚀 Calling Hugging Face FLUX API...");

    const response = await axios.post(
      'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'image/jpeg',
        },
        responseType: "arraybuffer",
        timeout: 60000,
      },
    );

    console.log("✅ Hugging Face Response Status:", response.status);
    console.log("✅ Hugging Face Response Headers:", response.headers);

    if (response.status !== 200) {
      console.error("❌ Non-200 response from Hugging Face:", response.data);
      return res.status(response.status).json({
        success: false,
        message: `Hugging Face error: ${response.data?.message || "Unknown error"}`,
      });
    }

    console.log("✅ Hugging Face Response received successfully");

    // Convert arraybuffer to base64
    const base64Image = Buffer.from(response.data).toString("base64");
    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

    console.log("📤 Uploading to Cloudinary...");
    console.log("✅ Cloudinary Config Check:", {
      cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
      cloud_name_value:
        process.env.CLOUDINARY_CLOUD_NAME?.substring(0, 10) + "...",
      api_key: !!process.env.CLOUDINARY_API_KEY,
      api_key_value: process.env.CLOUDINARY_API_KEY?.substring(0, 10) + "...",
      api_secret: !!process.env.CLOUDINARY_API_SECRET,
      api_secret_value:
        process.env.CLOUDINARY_API_SECRET?.substring(0, 10) + "...",
    });

    // Upload to Cloudinary with enhanced error handling
    let secure_url;
    try {
      // Use unsigned upload strategy with custom preset
      const upload = await cloudinary.uploader.upload(imageDataUrl, {
        unsigned: true,
        upload_preset: "qco39ytg",
      });
      secure_url = upload.secure_url;
      console.log("SUCCESS: Image uploaded to Cloudinary:", upload.secure_url);
    } catch (cloudinaryError) {
      console.error("❌ Cloudinary Error:", cloudinaryError.message);
      console.error("❌ Cloudinary HTTP Code:", cloudinaryError.http_code);
      console.error("❌ Full Cloudinary Error Details:", cloudinaryError);
      return res.status(500).json({
        success: false,
        message: `Cloudinary upload failed: ${cloudinaryError.message}`,
      });
    }

    // Save to database
    await sql`INSERT INTO creations (user_id, prompt, content, type, publish)
    VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;

    // Update usage for free users
    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    console.log("✅ Image generation completed successfully");
    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.error("❌ Backend Error:", error.message);
    console.error("❌ Error Status:", error.response?.status);
    console.error("❌ Error Data:", error.response?.data);
    console.error("❌ Full Error:", error);
    console.error("Hugging Face Error Details:", error.response?.data);
    
    // Add buffer error logging for debugging
    if (error.response?.data) {
      console.log("Buffer error data:", error.response.data.toString());
    }

    // Handle specific 403 errors
    if (error.response?.status === 403) {
      return res.status(403).json({
        success: false,
        message:
          "API authentication failed. Check your Hugging Face API key and permissions.",
      });
    }

    res.json({ success: false, message: error.message });
  }
};

export const removeBackground = async (req, res) => {
  try {
    const auth = req.auth();
    const { userId } = auth;
    const { imageBase64 } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: "Image is required.",
      });
    }

    const FormData = (await import("form-data")).default;
    const formData = new FormData();
    formData.append("image_file_b64", imageBase64);
    formData.append("size", "preview");

    console.log("API Key exists:", !!process.env.REMOVEBG_API_KEY);
    console.log(
      "API Key first 5 chars:",
      process.env.REMOVEBG_API_KEY?.substring(0, 5),
    );

    const response = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "X-Api-Key": process.env.REMOVEBG_API_KEY,
        },
        responseType: "arraybuffer",
      },
    );

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers["content-type"]);

    const base64Result = Buffer.from(response.data).toString("base64");
    const contentType = response.headers["content-type"] || "image/png";
    const imageDataUrl = `data:${contentType};base64,${base64Result}`;
    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }
    res.json({ success: true, content: imageDataUrl });
  } catch (error) {
    console.log(error.message);
    console.log("Remove.bg error status:", error.response?.status);
    console.log("Remove.bg error data:", error.response?.data?.toString());
    res.json({ success: false, message: error.message });
  }
};

export const removeObject = async (req, res) => {
  try {
    const auth = req.auth();
    const { userId } = auth;
    const { imageBase64, objectName } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    if (!imageBase64 || !objectName) {
      return res.status(400).json({
        success: false,
        message: "Image and object name are required.",
      });
    }

    // Extract base64 data
    const base64Data = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Use Hugging Face Inference API for object removal
    const response = await axios.post(
      "https://router.huggingface.co/hf-inference/models/briaai/RMBG-1.4",
      imageBuffer,
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "image/jpeg",
        },
        responseType: "arraybuffer",
        timeout: 60000,
      },
    );

    const resultBase64 = Buffer.from(response.data).toString("base64");
    const imageDataUrl = `data:image/png;base64,${resultBase64}`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.json({ success: true, content: imageDataUrl });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getPublishedCreations = async (req, res) => {
  try {
    console.log("=== DATABASE CONNECTION TEST ===");
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    console.log(
      "DATABASE_URL format:",
      process.env.DATABASE_URL?.substring(0, 20) + "...",
    );

    // Test database connection
    const testResult = await sql`SELECT 1 as test`;
    console.log("Database connection test:", testResult);

    const rows = await sql`
      SELECT * FROM creations 
      WHERE publish = true 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    console.log("✅ Published creations fetched:", rows.length);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.log("❌ DATABASE ERROR:", error);
    console.log("❌ ERROR DETAILS:", {
      message: error.message,
      code: error.code,
      severity: error.severity,
      detail: error.detail,
      hint: error.hint,
    });
    res.json({ success: false, message: error.message });
  }
};

export const toggleLike = async (req, res) => {
  try {
    console.log("=== TOGGLE LIKE DEBUG ===");

    const auth = req.auth();
    console.log("Auth object:", auth);
    const { userId: authUserId } = auth;
    console.log("Auth userId:", authUserId);

    const { creationId, userId } = req.body;
    console.log("Request body creationId:", creationId);
    console.log("Request body userId:", userId);

    // Use userId from request body if available, otherwise from auth
    const finalUserId = userId || authUserId;
    console.log("Final userId to use:", finalUserId);

    if (!finalUserId || !creationId) {
      console.log("❌ Missing userId or creationId");
      return res.status(400).json({
        success: false,
        message: "User ID and creation ID are required.",
      });
    }

    console.log("✅ Auth validation passed");

    // Get current creation with likes
    console.log("🔍 Querying database for creation...");
    const [creation] = await sql`
      SELECT likes FROM creations 
      WHERE id = ${creationId}
    `;
    console.log("Database result:", creation);

    if (!creation) {
      console.log("❌ Creation not found");
      return res.status(404).json({
        success: false,
        message: "Creation not found.",
      });
    }

    console.log("✅ Creation found, current likes:", creation.likes);

    // Parse current likes array
    let currentLikes = [];
    try {
      currentLikes =
        typeof creation.likes === "string"
          ? JSON.parse(creation.likes)
          : creation.likes || [];
      console.log("✅ Parsed likes array:", currentLikes);
    } catch (parseError) {
      console.log("❌ Error parsing likes:", parseError);
      currentLikes = [];
    }

    // Toggle like using PostgreSQL array functions
    let newLikes;
    if (currentLikes.includes(finalUserId)) {
      // Unlike - remove user ID from likes using array_remove
      newLikes = await sql`
        SELECT array_remove(likes, ${finalUserId}) as new_likes
        FROM (
          SELECT COALESCE(likes, '{}') as likes 
          FROM creations 
          WHERE id = ${creationId}
        ) subquery
      `;
      newLikes = newLikes[0].new_likes;
      console.log("👎 Unliking - removing user from likes");
    } else {
      // Like - add user ID to likes using array_append
      newLikes = await sql`
        SELECT array_append(likes, ${finalUserId}) as new_likes
        FROM (
          SELECT COALESCE(likes, '{}') as likes 
          FROM creations 
          WHERE id = ${creationId}
        ) subquery
      `;
      newLikes = newLikes[0].new_likes;
      console.log("👍 Liking - adding user to likes");
    }

    console.log("📝 New likes array:", newLikes);

    // Update database with proper PostgreSQL array
    console.log("💾 Updating database...");
    await sql`
      UPDATE creations 
      SET likes = ${newLikes} 
      WHERE id = ${creationId}
    `;
    console.log("✅ Database updated successfully");

    res.json({
      success: true,
      likes: newLikes,
    });
  } catch (error) {
    console.log("❌ TOGGLE LIKE ERROR:", error);
    console.log("❌ ERROR DETAILS:", {
      message: error.message,
      code: error.code,
      severity: error.severity,
      detail: error.detail,
      hint: error.hint,
    });
    res.json({ success: false, message: error.message });
  }
};

export const getUserCreations = async (req, res) => {
  try {
    const auth = req.auth();
    const { userId } = auth;

    const rows = await sql`
      SELECT * FROM creations
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    res.json({ success: true, data: rows });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
