import express from "express";
import cors from "cors";

const app = express(); // Correctly initialize express
app.use(cors()); // Use CORS middleware

export default app; // Default export for easier imports
