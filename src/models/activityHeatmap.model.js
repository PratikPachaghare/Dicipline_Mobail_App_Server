import mongoose from "mongoose";

/*
  GitHub-style activity / heatmap
  - One document per user per day
*/

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    date: {
      type: Date, // only date (00:00)
      required: true,
      index: true,
    },

    completedTasks: {
      type: Number,
      default: 0,
    },

    level: {
      type: Number,
      default: 0, // 0–4 (green shades)
    },
  },
  { timestamps: true }
);

activitySchema.index({ user: 1, date: 1 }, { unique: true });

export const Activity = mongoose.model("Activity", activitySchema);
