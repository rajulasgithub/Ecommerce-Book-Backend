import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  fullPhone: {
    type: String,
    unique: true,
    required:true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["customer", "seller","admin"],
  },
  blocked: {
  type: Boolean,
  default: false
}

},
{ timestamps: true }
);



export const User = mongoose.model("User", userSchema);
