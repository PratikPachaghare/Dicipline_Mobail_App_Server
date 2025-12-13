import mongoose from "mongoose";

const taskItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    icon: String,

    // 🔥 Sirf ye store hoga
    lastCompletedDate: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);
const taskListSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },

    tasks: [taskItemSchema],

    totalTasks: {
      type: Number,
      default: 0,
    },

    todayCompletedCount: {
      type: Number,
      default: 0,
    },

    lastResetDate: {
      type: Date,
      default: null,
    },

    streak: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const TaskList = mongoose.model("TaskList", taskListSchema);
