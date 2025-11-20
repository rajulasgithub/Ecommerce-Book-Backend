import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
  user:{
    type:mongoose.Types.ObjectId, ref:"users",required:true
  },
  image: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
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
{timestamps: true});

export const Book = mongoose.model("books", bookSchema);

