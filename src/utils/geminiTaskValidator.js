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
