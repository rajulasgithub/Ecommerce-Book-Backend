import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true,
  },
  excerpt: {
    type: String,
    required: false,
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
  },
  genre: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  is_deleted: {
    type: Boolean,
    default: false
  },

});

export const Book = mongoose.model("books", bookSchema);

