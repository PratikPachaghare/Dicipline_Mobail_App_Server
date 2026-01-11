import express from 'express';
import http from 'http'; // ✅ Added missing import
import cors from 'cors';
import { Server } from 'socket.io';

// Import Routes
import authRouter from "./routes/auth.routes.js";
import taskRouter from "./routes/task.routes.js";
import streakRouter from "./routes/streak.routes.js";
import weeklyRouter from "./routes/weekly.routes.js";
import chatRouter from "./routes/chat.routes.js";
import activityHeatmapRouter from "./routes/activityHeatmap.routes.js";
import leaderboardRouter from "./routes/leaderboard.routes.js";

const app = express();

// ✅ 1. Create HTTP Server (Needed for Socket.io)
const server = http.createServer(app);

// ✅ 2. Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (Change this to your frontend URL in production)
    methods: ["GET", "POST"],
    credentials: true
  },
});

// ✅ 3. Make 'io' accessible in controllers via req.app.get('io')
app.set("io", io);

// ✅ 4. Socket Events
io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  socket.on("typing", ({ roomId, userName }) => {
    socket.to(roomId).emit("display_typing", userName);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

// ✅ 5. Middleware (Cleaned up)
app.use(cors({
    origin: true, // Auto-reflects the request origin
    credentials: true
}));

app.use(express.json({ limit: "20kb" })); 
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

// ✅ 6. Routes
app.use('/api/auth', authRouter);
app.use('/api/task', taskRouter);
app.use('/api/streak', streakRouter);
app.use('/api/weekly', weeklyRouter);
app.use('/api/chat', chatRouter);
app.use('/api/activityHeatmap', activityHeatmapRouter);
app.use("/api/leaderboard", leaderboardRouter);

// ⚠️ IMPORTANT: Export 'server', not just 'app'
export { app, server };