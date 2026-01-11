import mongoose from "mongoose";

const leaderboardSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  // Store the top 3 (or top 100) winners of that week
  winners: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      name: String,
      avatar: String,
      score: Number,
      rank: Number,
    },
  ],
}, { timestamps: true });

export const LeaderboardHistory = mongoose.model("LeaderboardHistory", leaderboardSchema);