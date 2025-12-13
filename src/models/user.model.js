const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Note: Changed to 'bcrypt' as per your dependencies
const jwt = require('jsonwebtoken');
const config = require('../config/env');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Security: Don't return password by default
    },
    fullName: {
      type: String,
      trim: true,
    },
    // New: Profile Picture support
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // Gamification
    totalPoints: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);


userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, config.jwtSecret, {
    expiresIn: '30d',
  });
};

module.exports = mongoose.model('User', userSchema);