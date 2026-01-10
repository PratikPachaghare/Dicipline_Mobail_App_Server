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
    },
    // 👇 Add this field so icons are saved!
    icon: {
      type: String,
      default: 'star-outline' 
    },
    time: {
      type: String,  // Storing as "09:00 AM" is fine for this app
      default: '06:00 AM',
      trim: true,
    },
    isCustom: {
      type: Boolean,
      default: false,
      required: true
    },

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
