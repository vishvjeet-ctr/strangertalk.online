import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
   name: { type: String, required: true },
   email: { type: String, required: true },
   password: { type: String },
   dateOfBirth: { type: Date },
   verifaction: String,
   isVerified: {
      type: Boolean,
      default: false
   },
   googleId: {
      type: String,
      unique: true,
      sparse: true
   },
   createdAt: {
      type: Date,
      default: Date.now
   }
})

export const User = mongoose.model("user", userSchema)