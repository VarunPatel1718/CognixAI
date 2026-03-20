import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import { Readable } from 'stream';


const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});
export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth;
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
    const { userId } = req.auth;
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
    const { userId } = req.auth;
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
    const { userId } = req.auth;
    const { prompt, publish } = req.body;

    const seed = Math.floor(Math.random() * 1000)
    const imageUrl = `https://picsum.photos/seed/${seed}/1024/1024`

    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    })

    const base64Image = `data:image/jpeg;base64,${Buffer.from(response.data).toString('base64')}`
    const { secure_url } = await cloudinary.uploader.upload(base64Image)

    await sql`INSERT INTO creations (user_id, prompt, content, type, publish)
    VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;

    res.json({ success: true, content: secure_url })

  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}

export const removeBackground = async (req, res) => {
  try {
    const { userId } = req.auth;
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

export const getUserCreations = async (req, res) => {
  try {
    const { userId } = req.auth;

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