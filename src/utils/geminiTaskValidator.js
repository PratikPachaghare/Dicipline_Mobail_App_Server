import axios from "axios";

export const validateTaskWithImage = async ({ imageBase64, taskTitle }) => {
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
      "Gemini validation failed:",
      error.response?.data || error.message
    );
    return false;
  }
};


// import axios from "axios";

// export const validateTaskWithImage = async ({ imageBase64, taskTitle }) => {
//   try {
//     const GROQ_API_KEY = process.env.GROQ_API_KEY;

//     if (!GROQ_API_KEY) {
//       console.error("Missing GROQ_API_KEY");
//       return false;
//     }

//     const prompt = `
//     You are a strict validator.
//     Check if the given image proves that this task was completed.

//     Task: "${taskTitle}"

//     Rules:
//     - Answer only YES or NO
//     - Do not explain anything
//     `;

//     // 1. Prepare Base64 string
//     // Groq requires the full Data URI scheme (data:image/jpeg;base64,...)
//     // We strip the prefix first to ensure we don't double it up, then add it back cleanly.
//     const cleanBase64 = imageBase64.includes("base64,")
//       ? imageBase64.split("base64,")[1]
//       : imageBase64;

//     const imageUrl = `data:image/jpeg;base64,${cleanBase64}`;

//     // 2. Call Groq API
//     const response = await axios.post(
//       "https://api.groq.com/openai/v1/chat/completions",
//       {
//         model: "llama-3.2-90b-vision-preview", // Or "llama-3.2-11b-vision-preview" for faster/cheaper inference
//         messages: [
//           {
//             role: "user",
//             content: [
//               { type: "text", text: prompt },
//               {
//                 type: "image_url",
//                 image_url: {
//                   url: imageUrl,
//                 },
//               },
//             ],
//           },
//         ],
//         temperature: 0, // Keep it deterministic
//         max_tokens: 10, // We only need a short YES/NO response
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${GROQ_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     // 3. Parse Response
//     const answer = response.data?.choices?.[0]?.message?.content;

//     if (!answer) {
//       console.warn("Groq returned no text:", response.data);
//       return false;
//     }

//     return answer.toUpperCase().includes("YES");

//   } catch (error) {
//     console.error(
//       "Groq validation failed:",
//       error.response?.data || error.message
//     );
//     return false;
//   }
// };