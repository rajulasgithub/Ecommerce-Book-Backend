import mongoose from "mongoose";


const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

const bookSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId, ref: "User", required: true
  },
  image: {
    type: [String],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  excerpt: {
    type: String,
    required: false,
    trim: true
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
    trim: true
  },
  genre: {
    type: String,
    required: true,
    trim: true
  },
  language: {
    type: String,
    required: true,
    trim: true
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
  reviews: [reviewSchema],
  avgRating: {
    type: Number,
    default: 0,
  },

  totalReviews: {
    type: Number,
    default: 0,
  },

},
  { timestamps: true });


bookSchema.methods.calculateRating = function () {
  if (this.reviews.length === 0) {
    this.avgRating = 0;
    this.totalReviews = 0;
    return;
  }

  const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);

  this.avgRating = total / this.reviews.length;
  this.totalReviews = this.reviews.length;
};

export const Book = mongoose.model("Book", bookSchema);

