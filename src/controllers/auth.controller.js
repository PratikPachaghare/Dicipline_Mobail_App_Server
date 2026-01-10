import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

/* ===============================
   Generate JWT
=============================== */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/* ===============================
   REGISTER (AUTO LOGIN)
=============================== */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password,phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone
    });

    // 🔥 AUTO LOGIN AFTER REGISTER
    const token = generateToken(user._id);

    return res.status(201).json({
      message: "Registered & logged in successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone:user.phone
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
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const verifyToken = async (req, res) => {
  // If the request reaches here, the 'protect' middleware has already 
  // verified the token and added 'req.user' to the request.
  
  res.status(200).json(
    {
      success: true,
      message: "Token is valid",
      user: req.user,
    }
  );
};
