import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import { Readable } from 'stream';

// Configure Cloudinary V2 immediately after import
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

export const generateArticle = async (req, res) => {
  try {
    const auth = req.auth();
    const { userId } = auth;
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== 'premium' && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue."
      })
    }
    const response = await AI.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [{
        role: "user",
        content: prompt,
      },
      ],
      temperature: 0.7,
      max_tokens: length,
    });

    const content = response.choices[0].message.content
    await sql` INSERT INTO creations (user_id, prompt, content, type)
    VALUES (${userId}, ${prompt}, ${content}, 'article')`;

    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1
        }
      })
    }

    res.json({ success: true, content })



  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }

}

export const generateBlogTitle = async (req, res) => {
  try {
    const auth = req.auth();
    const { userId } = auth;
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== 'premium' && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue."
      })
    }
    const response = await AI.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [{
        role: "user",
        content: prompt,
      },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content
    await sql` INSERT INTO creations (user_id, prompt, content, type)
    VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;

    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1
        }
      })
    }

    res.json({ success: true, content })



  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }

}

export const reviewResume = async (req, res) => {
  try {
    const auth = req.auth();
    const { userId } = auth;
    const { resumeText } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== 'premium' && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue."
      })
    }

    const response = await AI.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume reviewer. Analyze the resume provided and respond ONLY in valid JSON format with these exact keys: \"strengths\", \"improvements\", \"keywords\", and \"ats_score\". Do not include any markdown code blocks, conversational text, or explanations outside of the JSON. The response must be a single JSON object.\n\n" +
            "For the strengths field: List 3-5 key strengths from the resume\n\n" +
            "For the improvements field: List 3-5 specific areas for improvement\n\n" +
            "For the keywords field: List 5-10 relevant keywords for ATS systems\n\n" +
            "For the ats_score field: Provide a score from 1-100 based on ATS compatibility\n\n" +
            "Example format: {\"strengths\": \"Strong technical skills...\", \"improvements\": \"Add more metrics...\", \"keywords\": \"React, Node.js...\", \"ats_score\": 85}",
        },
        {
          role: "user",
          content: resumeText,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;

    await sql` INSERT INTO creations (user_id, prompt, content, type)
    VALUES (${userId}, ${resumeText}, ${content}, 'resume-review')`;

    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
}

export const generateImage = async (req, res) => {
  try {
    const auth = req.auth();
    const { userId } = auth;
    const { prompt, publish } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    console.log('=== IMAGE GENERATION DEBUG ===');
    console.log('Request Body:', { prompt, publish, userId, plan });
    console.log('Auth Object:', auth);

    if (plan !== 'premium' && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue."
      });
    }

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required."
      });
    }

    // Check if Stability API key exists
    if (!process.env.STABILITY_API_KEY) {
      console.error('❌ STABILITY_API_KEY is missing from environment');
      return res.status(500).json({
        success: false,
        message: "Server configuration error: API key missing."
      });
    }

    console.log('✅ API Key exists:', !!process.env.STABILITY_API_KEY);
    console.log('✅ API Key first 10 chars:', process.env.STABILITY_API_KEY?.substring(0, 10));
    console.log('✅ API Key length:', process.env.STABILITY_API_KEY?.length);

    // Call Stability AI API
    console.log('🚀 Calling Stability AI API...');
    
    const response = await axios.post(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      {
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 30
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 60000
      }
    );

    console.log('✅ Stability AI Response Status:', response.status);
    console.log('✅ Stability AI Response Headers:', response.headers);

    if (response.status !== 200) {
      console.error('❌ Non-200 response from Stability AI:', response.data);
      return res.status(response.status).json({
        success: false,
        message: `Stability AI error: ${response.data?.message || 'Unknown error'}`
      });
    }

    console.log('✅ Stability AI Response Data:', response.data);

    if (!response.data || !response.data.artifacts || response.data.artifacts.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate image: No artifacts in response."
      });
    }

    // Get base64 image from response and format correctly
    const base64Data = 'data:image/png;base64,' + response.data.artifacts[0].base64;
    
    console.log('📤 Uploading to Cloudinary...');
    console.log('✅ Cloudinary Config Check:', {
      cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
      cloud_name_value: process.env.CLOUDINARY_CLOUD_NAME?.substring(0, 10) + '...',
      api_key: !!process.env.CLOUDINARY_API_KEY,
      api_key_value: process.env.CLOUDINARY_API_KEY?.substring(0, 10) + '...',
      api_secret: !!process.env.CLOUDINARY_API_SECRET,
      api_secret_value: process.env.CLOUDINARY_API_SECRET?.substring(0, 10) + '...'
    });

    // Upload to Cloudinary with enhanced error handling
    let secure_url;
    try {
      // Use unsigned upload strategy with custom preset
      const upload = await cloudinary.uploader.upload(base64Data, { 
        unsigned: true,
        upload_preset: 'qco39ytg'
      });
      secure_url = upload.secure_url;
      console.log('SUCCESS: Image uploaded to Cloudinary:', upload.secure_url);
    } catch (cloudinaryError) {
      console.error('❌ Cloudinary Error:', cloudinaryError.message);
      console.error('❌ Cloudinary HTTP Code:', cloudinaryError.http_code);
      console.error('❌ Full Cloudinary Error Details:', cloudinaryError);
      return res.status(500).json({
        success: false,
        message: `Cloudinary upload failed: ${cloudinaryError.message}`
      });
    }

    // Save to database
    await sql`INSERT INTO creations (user_id, prompt, content, type, publish)
    VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;

    // Update usage for free users
    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    console.log('✅ Image generation completed successfully');
    res.json({ success: true, content: secure_url });

  } catch (error) {
    console.error('❌ Backend Error:', error.message);
    console.error('❌ Error Status:', error.response?.status);
    console.error('❌ Error Data:', error.response?.data);
    console.error('❌ Full Error:', error);
    console.error('Stability AI Error Details:', error.response?.data);
    
    // Handle specific 403 errors
    if (error.response?.status === 403) {
      return res.status(403).json({
        success: false,
        message: "API authentication failed. Check your Stability AI API key and credits."
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

    if (plan !== 'premium' && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue."
      });
    }

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: "Image is required."
      });
    }

    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('image_file_b64', imageBase64);
    formData.append('size', 'preview');

    console.log("API Key exists:", !!process.env.REMOVEBG_API_KEY);
    console.log("API Key first 5 chars:", process.env.REMOVEBG_API_KEY?.substring(0, 5));

    const response = await axios.post(
      'https://api.remove.bg/v1.0/removebg',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'X-Api-Key': process.env.REMOVEBG_API_KEY,
        },
        responseType: 'arraybuffer',
      }
    )

    console.log('Response status:', response.status)
    console.log('Response headers:', response.headers['content-type'])

    const base64Result = Buffer.from(response.data).toString('base64')
    const contentType = response.headers['content-type'] || 'image/png'
    const imageDataUrl = `data:${contentType};base64,${base64Result}`
    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }
    res.json({ success: true, content: imageDataUrl })
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

    if (plan !== 'premium' && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue."
      });
    }

    if (!imageBase64 || !objectName) {
      return res.status(400).json({
        success: false,
        message: "Image and object name are required."
      });
    }

    // Extract base64 data
    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // Use Hugging Face Inference API for object removal
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/briaai/RMBG-1.4',
      imageBuffer,
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'image/jpeg',
        },
        responseType: 'arraybuffer',
        timeout: 60000
      }
    )

    const resultBase64 = Buffer.from(response.data).toString('base64')
    const imageDataUrl = `data:image/png;base64,${resultBase64}` 

    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 }
      })
    }

    res.json({ success: true, content: imageDataUrl })

  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}

export const getPublishedCreations = async (req, res) => {
  try {
    console.log('=== DATABASE CONNECTION TEST ===');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('DATABASE_URL format:', process.env.DATABASE_URL?.substring(0, 20) + '...');
    
    // Test database connection
    const testResult = await sql`SELECT 1 as test`;
    console.log('Database connection test:', testResult);
    
    const rows = await sql`
      SELECT * FROM creations 
      WHERE publish = true 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    console.log('✅ Published creations fetched:', rows.length);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.log('❌ DATABASE ERROR:', error);
    console.log('❌ ERROR DETAILS:', {
      message: error.message,
      code: error.code,
      severity: error.severity,
      detail: error.detail,
      hint: error.hint
    });
    res.json({ success: false, message: error.message });
  }
};

export const toggleLike = async (req, res) => {
  try {
    console.log('=== TOGGLE LIKE DEBUG ===');
    
    const auth = req.auth();
    console.log('Auth object:', auth);
    const { userId } = auth;
    console.log('Extracted userId:', userId);
    
    const { creationId } = req.body;
    console.log('Request body creationId:', creationId);

    if (!userId || !creationId) {
      console.log('❌ Missing userId or creationId');
      return res.status(400).json({
        success: false,
        message: "User ID and creation ID are required."
      });
    }

    console.log('✅ Auth validation passed');

    // Get current creation with likes
    console.log('🔍 Querying database for creation...');
    const [creation] = await sql`
      SELECT likes FROM creations 
      WHERE id = ${creationId}
    `;
    console.log('Database result:', creation);

    if (!creation) {
      console.log('❌ Creation not found');
      return res.status(404).json({
        success: false,
        message: "Creation not found."
      });
    }

    console.log('✅ Creation found, current likes:', creation.likes);

    // Parse current likes array
    let currentLikes = [];
    try {
      currentLikes = typeof creation.likes === 'string' 
        ? JSON.parse(creation.likes) 
        : (creation.likes || []);
      console.log('✅ Parsed likes array:', currentLikes);
    } catch (parseError) {
      console.log('❌ Error parsing likes:', parseError);
      currentLikes = [];
    }

    // Toggle like using PostgreSQL array functions
    let newLikes;
    if (currentLikes.includes(userId)) {
      // Unlike - remove user ID from likes using array_remove
      newLikes = await sql`
        SELECT array_remove(likes, ${userId}) as new_likes
        FROM (
          SELECT COALESCE(likes, '{}') as likes 
          FROM creations 
          WHERE id = ${creationId}
        ) subquery
      `;
      newLikes = newLikes[0].new_likes;
      console.log('👎 Unliking - removing user from likes');
    } else {
      // Like - add user ID to likes using array_append
      newLikes = await sql`
        SELECT array_append(likes, ${userId}) as new_likes
        FROM (
          SELECT COALESCE(likes, '{}') as likes 
          FROM creations 
          WHERE id = ${creationId}
        ) subquery
      `;
      newLikes = newLikes[0].new_likes;
      console.log('👍 Liking - adding user to likes');
    }

    console.log('📝 New likes array:', newLikes);

    // Update database with proper PostgreSQL array
    console.log('💾 Updating database...');
    await sql`
      UPDATE creations 
      SET likes = ${newLikes} 
      WHERE id = ${creationId}
    `;
    console.log('✅ Database updated successfully');

    res.json({ 
      success: true, 
      likes: newLikes 
    });

  } catch (error) {
    console.log('❌ TOGGLE LIKE ERROR:', error);
    console.log('❌ ERROR DETAILS:', {
      message: error.message,
      code: error.code,
      severity: error.severity,
      detail: error.detail,
      hint: error.hint
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

    res.json({ success: true, data: rows })
  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}