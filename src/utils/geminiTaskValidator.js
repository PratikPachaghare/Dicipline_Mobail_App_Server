import axios from "axios";

export const validateTaskWithImage = async ({ imageBase64, taskTitle }) => {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    const prompt = `
You are a strict validator.
Check if the given image proves that this task was completed.

Task: "${taskTitle}"

Rules:
- Answer only YES or NO
- Do not explain anything
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      }
    );

    const answer = response.data.candidates?.[0]?.content?.parts?.[0]?.text
      ?.trim()
      ?.toUpperCase();

    return answer === "YES";
  } catch (error) {
    console.error("Gemini validation failed:", error.message);
    return false;
  }
};
