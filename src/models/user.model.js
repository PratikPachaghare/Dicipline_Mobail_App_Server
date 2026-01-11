import mongoose from "mongoose";

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
    name: {
      type: String,
      trim: true,
    },
    phone:{
      type:Number,
      required:true
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
    totalPoints: {
      type: Number,
      default: 0,
      index: true, // Index for faster global ranking
    },
    weeklyPoints: {
      type: Number,
      default: 0,
      index: true, // Index for faster weekly sorting
    },
    gender:{
      type:String,
      default:"Male"
    },
  },
  { timestamps: true }
);


// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// userSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// userSchema.methods.getSignedJwtToken = function () {
//   return jwt.sign({ id: this._id },process.env.JWT_SECRET , {
//     expiresIn: '30d',
//   });
// };

export const User = mongoose.model("User", userSchema);