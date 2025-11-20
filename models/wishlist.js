import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
     user:{
        type:mongoose.Types.ObjectId, ref:"users",required:true
      },
    items: [
      {
        book: { type: mongoose.Schema.Types.ObjectId, ref: "books", required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Wishlist = mongoose.model("Wishlist", wishlistSchema);
