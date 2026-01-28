import axios from "axios";
import FormData from 'form-data';
import fs from 'fs';

export const validateTaskWithImage = async ({ imageBase64, taskTitle,description }) => {
  try {
//     const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

//     const prompt = `
// You are a strict validator.
// Check if the given image proves that this task was completed.

// Task: "${taskTitle}"

// Rules:
// - Answer only YES or NO
// - Do not explain anything
// `;

//     // 🔥 CLEAN BASE64
//     const cleanBase64 = imageBase64.includes("base64,")
//       ? imageBase64.split("base64,")[1]
//       : imageBase64;

//     const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
//       {
//         contents: [
//           {
//             parts: [
//               { text: prompt },
//               {
//                 inline_data: {
//                   mime_type: "image/jpeg",
//                   data: cleanBase64,
//                 },
//               },
//             ],
//           },
//         ],
//       }
//     );

//    const answer =
//   response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

// if (!answer) {
//   console.warn("Gemini returned no text:", response.data);
//   return false;
// }

// return answer.toUpperCase().includes("YES");
return true;

  } catch (error) {
    console.error(
      "Groq validation failed:",
      error.response?.data || error.message
    );
    return false;
  }
};



const AI_SERVER_URL = 'http://127.0.0.1:6000/predict';

// ⚠️ CHANGE: Maine ({}) hata diye hain. Ab ye seedha arguments lega.
export const verifyTaskWithAI = async (imagePath, taskTitle, description) => {
  try {
    // 1. Check karein file path string hai ya nahi
    if (!imagePath || typeof imagePath !== 'string') {
        console.error("❌ Error: Invalid image path received:", imagePath);
        return false;
    }

    // 2. File Exist Check
    if (!fs.existsSync(imagePath)) {
        console.error(`❌ Error: File not found on disk at: ${imagePath}`);
        return false;
    }

    // Task description setup
    const taskPrompt = description || taskTitle;
    console.log(`🔄 Sending to AI Server... \n📄 Image: ${imagePath} \nwm Task: "${taskPrompt}"`);

    // 3. Prepare Form Data
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath)); 
    form.append('task', taskPrompt);

    // 4. Call Python Server
    const response = await axios.post(AI_SERVER_URL, form, {
      headers: {
        ...form.getHeaders()
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    // 5. Result
    const data = response.data;
    console.log(`🤖 AI Response: Score ${data.score?.toFixed(3)} | Result: ${data.result}`);

    // Agar result 1 hai to TRUE, varna FALSE
    return data.result === 1;

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
        console.error("⚠️ Error: Python Server band hai. Please run 'python server.py'");
    } else {
        console.error("⚠️ AI Service Error:", error.message);
    }
    // Fail-safe: Agar server down hai to kya karein? (Abhi False bhej rahe hain)
    return false;
  }
};

// --- CONTROLLER MEIN KAISE USE KAREIN ---
/* Apne main file mein ab aise import karein:
   
   import { verifyTaskWithAI } from './aiService.js';  <-- .js lagana zaruri hai imports mein
*/
// verifyTaskWithAI('./uploads/user_photo.jpg', 'gym workout');



export const validateTaskWithImagegoq = async ({
  imageBase64,
  taskTitle,
  description,
}) => {
  try {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      console.error("Missing GROQ_API_KEY");
      return false;
    }

    const prompt = `
    You are a strict validator.
    Check if the given image proves that this task was completed.

    Task: "${taskTitle}"
    description : "${description}

    Rules:
    - Answer only YES or NO
    - Do not explain anything
    `;

    if (!imageBase64) {
      console.error("Image base64 is null or empty");
      return false;
    }
    // 1. Prepare Base64 string
    // Groq requires the full Data URI scheme (data:image/jpeg;base64,...)
    // We strip the prefix first to ensure we don't double it up, then add it back cleanly.
    const cleanBase64 = imageBase64.includes("base64,")
  ? imageBase64.split("base64,")[1]
  : imageBase64;

    const imageUrl = `data:image/jpeg;base64,${cleanBase64}`;

    // 2. Call Groq API
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "openai/gpt-oss-120b", // Or "llama-3.2-11b-vision-preview" for faster/cheaper inference
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        temperature: 0, // Keep it deterministic
        max_tokens: 10, // We only need a short YES/NO response
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );
    console.log("groq response", response);
    // 3. Parse Response
    const answer = response.data?.choices?.[0]?.message?.content;

    if (!answer) {
      console.warn("Groq returned no text:", response.data);
      return false;
    }

    return answer.toUpperCase().includes("YES");
  } catch (error) {
    console.error(
      "Groq validation failed:",
      error.response?.data || error.message,
    );
    return false;
  }
};
