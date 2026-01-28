import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import { encryptPrivateKey, generateRSAKeys } from "../utils/crypto.js";

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone ,gender='Male'} =
      req.body;

    if (
      !name ||
      !email ||
      !password ||
      !phone
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

  // 1️ Generate keys
  const { publicKey, privateKey } = generateRSAKeys();

  // 2️ Encrypt private key with password
  const encryptedPrivateKey = encryptPrivateKey(privateKey, password);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      gender,
      publicKey,
      encryptedPrivateKey,
    });

    // 🔥 AUTO LOGIN AFTER REGISTER
    const token = generateToken(user._id);

    return res.status(201).json({
      message: "Registered & logged in successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        gender:user.gender,
        publicKey: user.publicKey,
        encryptedPrivateKey: user.encryptedPrivateKey,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   LOGIN
=============================== */
export const loginUser = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    console.log("Login attempt with:", { email, phone });
    // ✅ email OR phone required
    if (!email && !phone) {
      return res.status(400).json({
        message: "Email or phone is required",
      });
    }

    // ✅ password required
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // 🔍 find user by email OR phone
    const user = await User.findOne({
      $or: [{ email }, { phone }],
    }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🔐 password check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🎟 JWT
    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        publicKey: user.publicKey,
        encryptedPrivateKey: user.encryptedPrivateKey,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateKeysAndClearData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { publicKey, encryptedPrivateKey } = req.body;

    if (!publicKey || !encryptedPrivateKey) {
      return res.status(400).json({ message: "Keys are required" });
    }

    console.log(`⚠️ RESETTING ACCOUNT FOR: ${userId}`);

    // --- STEP 1: Update User Keys ---
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        publicKey: publicKey,
        encryptedPrivateKey: encryptedPrivateKey,
      },
      { new: true },
    );
    // Option A: Delete Messages associated with this user
    await Message.updateMany(
      {
        $or: [{ sender: userId }, { receiver: userId }], // Meri saari chats
      },
      {
        $addToSet: { deletedFor: userId }, // Sirf mera ID list me add karo (Duplicate nahi hoga)
      },
    );

    await Chat.deleteMany({
      users: { $in: [userId] },
    });

    console.log("✅ Keys Updated & Old History Wiped.");

    return res.status(200).json({
      success: true,
      message: "Security keys updated and old chats cleared successfully.",
      user: {
        id: updatedUser._id,
        publicKey: updatedUser.publicKey,
        // Private key wapas bhejne ki jarurat nahi, wo frontend ke paas already hai
      },
    });
  } catch (error) {
    console.error("Key Update Error:", error);
    return res
      .status(500)
      .json({ message: "Server error while updating keys" });
  }
};

export const verifyToken = async (req, res) => {
  // If the request reaches here, the 'protect' middleware has already
  // verified the token and added 'req.user' to the request.

  res.status(200).json({
    success: true,
    message: "Token is valid",
    user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        publicKey: req.user.publicKey,
        encryptedPrivateKey: req.user.encryptedPrivateKey,
      },
  });
};
