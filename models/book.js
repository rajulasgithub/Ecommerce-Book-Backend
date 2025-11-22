import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId, ref: "User", required: true
  },
  image: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim:true
  },
  description: {
    type: String,
    required: true,
    trim:true
  },
  excerpt: {
    type: String,
    required: false,
    trim:true
  },
  page_count: {
    type: Number,
    required: true,
  },
  publish_date: {
    type: Date,
    required: true,
  },
  author: {
    type: String,
    required: true,
    trim:true
  },
  genre: {
    type: String,
    required: true,
    trim:true
  },
  language: {
    type: String,
    required: true,
    trim:true
  },
  prize: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: ["Academic", "Fiction", "Non-Fiction", "Comics", "Children", "Poetry"],
    required: true,  
  },
  is_deleted: {
    type: Boolean,
    default: false
  },

},
  { timestamps: true });

export const Book = mongoose.model("Book", bookSchema);

