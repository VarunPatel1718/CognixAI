import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import { Readable } from "stream";
import FormData from "form-data";

// Configure Cloudinary V2 immediately after import
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const AI = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Groq AI
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth()
    const { prompt, length } = req.body
    const plan = req.plan
    const free_usage = req.free_usage

    if (plan !== 'premium' && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue."
      })
    }

    const lengthInstruction = length <= 800 
      ? 'Write a SHORT article of exactly 500-800 words.' 
      : length <= 1200 
      ? 'Write a MEDIUM length article of exactly 800-1200 words.'
      : 'Write a LONG article of exactly 1200-1600 words.'

    let response
    try {
      response = await AI.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{
          role: "user",
          content: `${lengthInstruction} Write in plain paragraphs only. Do NOT use bullet points, numbered lists, bold text, headers, or any markdown formatting. Use only plain text paragraphs. Topic: ${prompt}` 
        }],
        temperature: 0.7,
      })
    } catch (retryError) {
      if (retryError.message.includes('429')) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        response = await AI.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [{
            role: "user",
            content: `${lengthInstruction} Write in plain paragraphs only. Do NOT use bullet points, numbered lists, bold text, headers, or any markdown formatting. Use only plain text paragraphs. Topic: ${prompt}` 
          }],
          temperature: 0.7,
        })
      } else {
        throw retryError
      }
    }

    const content = response.choices[0].message.content
    await sql`INSERT INTO creations (user_id, prompt, content, type)
    VALUES (${userId}, ${prompt}, ${content}, 'article')`

    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 }
      })
    }

    res.json({ success: true, content })

  } catch (error) {
    console.log(error.message)
    if (error.message.includes('429')) {
      return res.json({
        success: false,
        message: "AI service is busy. Please wait 1-2 minutes and try again."
      })
    }
    res.json({ success: false, message: error.message })
  }
}

export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth()
    const { prompt } = req.body
    const plan = req.plan
    const free_usage = req.free_usage

    if (plan !== 'premium' && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue."
      })
    }

    let response
    try {
      response = await AI.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      })
    } catch (retryError) {
      if (retryError.message.includes('429')) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        response = await AI.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        })
      } else {
        throw retryError
      }
    }

    const content = response.choices[0].message.content
    await sql`INSERT INTO creations (user_id, prompt, content, type)
    VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`

    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 }
      })
    }

    res.json({ success: true, content })

  } catch (error) {
    console.log(error.message)
    if (error.message.includes('429')) {
      return res.json({
        success: false,
        message: "AI service is busy. Please wait 1-2 minutes and try again."
      })
    }
    res.json({ success: false, message: error.message })
  }
}

export const reviewResume = async (req, res) => {
  console.log("=== RESUME REVIEW CONTROLLER DEBUG ===");
  console.log("Resume controller started");
  console.log("Request body keys:", Object.keys(req.body));
  console.log("Request files:", req.files);
  console.log("Request file:", req.file);
  console.log("Request body:", req.body);

  try {
    const auth = req.auth();
    console.log("Auth object:", auth);

    const { userId } = auth;
    const { resumeText, jobDescription } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    console.log("Extracted data - userId:", userId);
    console.log("Extracted data - plan:", plan);
    console.log("Extracted data - free_usage:", free_usage);
    console.log(
      "Extracted data - resumeText length:",
      resumeText?.length || "undefined",
    );
    console.log(
      "Extracted data - resumeText preview:",
      resumeText?.substring(0, 100) + "..." || "undefined",
    );
    console.log("Extracted data - jobDescription provided:", !!jobDescription);
    console.log(
      "Extracted data - jobDescription length:",
      jobDescription?.length || "undefined",
    );
    console.log(
      "Extracted data - jobDescription preview:",
      jobDescription?.substring(0, 100) + "..." || "undefined",
    );

    if (!resumeText) {
      console.log("❌ Missing resumeText - returning 400");
      return res.status(400).json({
        success: false,
        message: "Resume text is required.",
      });
    }

    console.log("Checking usage limits...");
    console.log("Plan check - plan:", plan);
    console.log("Plan check - free_usage:", free_usage);
    console.log(
      "Plan check - condition:",
      plan !== "premium" && free_usage >= 10,
    );

    if (plan !== "premium" && free_usage >= 10) {
      console.log("❌ Usage limit exceeded - returning limit message");
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    console.log("✅ Usage limits passed - calling Groq AI...");
    console.log("API Key exists:", !!process.env.GROQ_API_KEY);
    console.log("API Key length:", process.env.GROQ_API_KEY?.length);

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: `You are an expert resume reviewer and ATS specialist. Analyze the following resume and return ONLY a valid JSON object with exactly these keys:

{
  "strengths": "detailed paragraph about strong points and impressive aspects",
  
  "areasForImprovement": "detailed paragraph about weaknesses and gaps that need fixing",
  
  "keywordSuggestions": "list specific ATS keywords, technical skills, and buzzwords missing from this resume that would help pass ATS filters",
  
  "atsScore": <a number between 0 and 100 representing how well this resume would perform in ATS systems based on formatting, keywords, structure, and clarity>,
  
  "atsBreakdown": "explain the ATS score - mention specific reasons for the score covering: keyword density, formatting issues, section headers, contact info completeness, and quantified achievements",
  
  "rewriteSuggestions": "pick 3 weak bullet points from the resume and rewrite them to be stronger using action verbs and metrics. Format as: ORIGINAL: ... → REWRITTEN: ..."
}

${
  jobDescription
    ? `

Additionally, analyze how well the resume matches the following job description and provide job matching analysis:

Job Description: ${jobDescription}

Resume Analysis: ${resumeText}

Please provide:
1. "jobMatchScore": <0-100 number for overall compatibility>
2. "jobMatchAnalysis": "detailed explanation of what matches well, what skills/experience are missing, and what improvements would make the resume stronger for this specific role"

Return ONLY JSON, no markdown, no extra text.`
    : ""
}

Return ONLY: JSON, no markdown, no extra text.`,
        },
      ],
      max_tokens: 1500,
    });

    const content = completion.choices[0].message.content;

    // Clean content by removing markdown backticks that Groq sometimes adds
    const cleanContent = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanContent);

    console.log("✅ Groq AI response received");
    console.log("Response content length:", content?.length || 0);
    console.log(
      "Response content preview:",
      content?.substring(0, 200) + "..." || "undefined",
    );

    console.log("Saving to database...");
    await sql` INSERT INTO creations (user_id, prompt, content, type)
    VALUES (${userId}, ${resumeText}, ${content}, 'resume-review')`;
    console.log("✅ Database save complete");

    if (plan !== "premium") {
      console.log("Updating usage metadata for free user...");
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
      console.log("✅ Usage metadata updated");
    }

    console.log("✅ Resume review completed successfully");
    res.json({
      success: true,
      content: {
        strengths: parsed.strengths,
        areasForImprovement: parsed.areasForImprovement,
        keywordSuggestions: parsed.keywordSuggestions,
        atsScore: parsed.atsScore,
        atsBreakdown: parsed.atsBreakdown,
        rewriteSuggestions: parsed.rewriteSuggestions,
        jobMatchScore: parsed.jobMatchScore,
        jobMatchAnalysis: parsed.jobMatchAnalysis,
      },
    });
  } catch (error) {
    console.log("❌ RESUME REVIEW ERROR:");
    console.log("Error message:", error.message);
    console.log("Error status:", error.response?.status);
    console.log("Error data:", error.response?.data);
    console.log("Full error object:", error);
    console.log("Error stack:", error.stack);

    // Check if this is a 403 error being swallowed
    if (error.response?.status === 403) {
      console.log("❌ 403 ERROR DETECTED IN CATCH BLOCK");
      console.log("403 Error Details:", error.response?.data);
      return res.status(403).json({
        success: false,
        message: "API authentication failed during resume review.",
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
      "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "image/jpeg",
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

export const chatWithAI = async (req, res) => {
  try {
    const { userId } = req.auth()
    const { messages } = req.body
    const plan = req.plan
    const free_usage = req.free_usage

    if (plan !== 'premium' && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue."
      })
    }

    const response = await AI.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are CognixAI Assistant, a helpful, 
          smart and friendly AI assistant. You help users 
          with any questions, tasks, coding, writing, analysis 
          and more. Be concise, helpful and professional.`
        },
        ...messages
      ],
      temperature: 0.7,
    })

    const content = response.choices[0].message.content

    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 }
      })
    }

    res.json({ success: true, content })

  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}

export const generateCode = async (req, res) => {
  try {
    const { userId } = req.auth()
    const { prompt, language, codeType } = req.body
    const plan = req.plan
    const free_usage = req.free_usage

    if (plan !== 'premium' && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue."
      })
    }

    const systemPrompt = codeType === 'full' 
    ? `You are an expert ${language} programmer. 
       Generate a COMPLETE, RUNNABLE ${language} program for: ${prompt}
   
   STRICT RULES:
   - Generate code in ${language} ONLY
   - Do NOT include code in any other language like Java, Python etc
   - Include ALL necessary imports/headers for ${language}
   - Include main function/entry point for ${language}
   - Include sample test cases with expected output
   - Add comments explaining the code
   - Make sure it compiles and runs without errors
   - For C++: use #include<bits/stdc++.h> and using namespace std
   - For Python: include if __name__ == '__main__': block
   - For Java: include proper class name and main method
   - For JavaScript/Node.js: include console.log test cases
   - For SQL: include CREATE TABLE and INSERT statements
   - OPTIMIZATION: Use the most efficient algorithm possible
   - OPTIMIZATION: Mention time complexity O(n) in comments
   - OPTIMIZATION: Mention space complexity in comments
   - OPTIMIZATION: Prefer built-in optimized functions
   - Return ONLY the ${language} code, nothing else`
    : `You are an expert ${language} programmer.
       Generate ONLY the core logic/function in ${language} for: ${prompt}
   
   STRICT RULES:
   - Generate code in ${language} ONLY
   - Do NOT include code in any other language like Java, Python etc
   - Write only the function/method (LeetCode style)
   - No main function needed
   - Use proper ${language} syntax and conventions
   - For C++: write as C++ function only, no Java/Python
   - For Python: write as Python function only, no C++/Java
   - For Java: write inside Solution class only, no C++/Python
   - For JavaScript: write as JS function only
   - For TypeScript: write as TS function with types
   - OPTIMIZATION: Use the most time-efficient algorithm
   - OPTIMIZATION: Add time complexity O(?) as comment
   - OPTIMIZATION: Add space complexity O(?) as comment
   - OPTIMIZATION: Prefer built-in optimized functions
   - Return ONLY the ${language} function code, nothing else`

    const response = await AI.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: systemPrompt }],
      temperature: 0.3,
    })

    const content = response.choices[0].message.content

    await sql`INSERT INTO creations (user_id, prompt, content, type)
    VALUES (${userId}, ${prompt}, ${content}, 'code')`

    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 }
      })
    }

    res.json({ success: true, content })

  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}

export const removeObject = async (req, res) => {
  try {
    const { userId } = req.auth();
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

    const FormData = (await import('form-data')).default
    const formData = new FormData()
    formData.append('image_file', imageBuffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg'
    })
    formData.append('size', 'preview')

    const response = await axios.post(
      'https://api.remove.bg/v1.0/removebg',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'X-Api-Key': process.env.REMOVEBG_API_KEY,
        },
        responseType: 'arraybuffer',
        timeout: 60000
      }
    )

    const resultBase64 = Buffer.from(response.data).toString('base64')
    const contentType = response.headers['content-type'] || 'image/png'
    const imageDataUrl = `data:${contentType};base64,${resultBase64}`

    await sql`INSERT INTO creations (user_id, prompt, content, type, publish)
    VALUES (${userId}, ${objectName}, ${imageDataUrl}, 'remove-object', false)`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.json({ 
      success: true, 
      content: imageDataUrl,
      message: 'Background removed. Main subject preserved.'
    });
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
