import express, { urlencoded } from 'express';
// import { dotenv } from 'dotenv';
import cors from 'cors';

// dotenv.config({
//     path:'./env'
// })
const app = express();

// app.use(cors({
//     origin: "http://localhost:3000",
//     credentials: true
// }));
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());  // <--- This allows reading req.body
app.use(express.urlencoded({ extended: true })); // <


app.use(express.json({ limit: "20kb" }));
app.use(urlencoded({
    extended: true,
    limit: "20kb"
}));

import authRouter from "./routes/auth.routes.js";
import taskRouter from "./routes/task.routes.js";
import streakRouter from "./routes/streak.routes.js";
import weeklyRouter from "./routes/weekly.routes.js";
import chatRouter from "./routes/chat.routes.js";
import activityHeatmapRouter from "./routes/activityHeatmap.routes.js";

app.use('/api/auth',authRouter);
app.use('/api/task',taskRouter);
app.use('/api/streak',streakRouter);
app.use('/api/weekly',weeklyRouter);
app.use('/api/chat',chatRouter);
app.use('/api/activityHeatmap',activityHeatmapRouter);


export default app; // Default export for easier imports
