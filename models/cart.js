import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
     user:{
        type:mongoose.Types.ObjectId, ref:"User",required:true
      },
    items: [
      {
        book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
        quantity: { type: Number, default: 1 },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Cart = mongoose.model("Cart", cartSchema);
