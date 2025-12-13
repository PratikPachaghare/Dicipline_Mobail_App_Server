import mongoose from "mongoose";

const streakSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },

    currentStreak: {
      type: Number,
      default: 0,
    },

    longestStreak: {
      type: Number,
      default: 0,
    },

    lastEvaluatedDate: {
      type: Date, // kis din ka streak calculate hua
      default: null,
    },
  },
  { timestamps: true }
);

export const Streak = mongoose.model("Streak", streakSchema);
