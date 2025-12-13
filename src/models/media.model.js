import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    url: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },

    size: {
      type: Number,
    },
  },
  { timestamps: true }
);

export const Media = mongoose.model("Media", mediaSchema);
