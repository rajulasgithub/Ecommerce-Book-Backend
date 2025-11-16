import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
     UserId:{
        type:mongoose.Types.ObjectId, ref:"users",required:true
      },
    items: [
      {
        book: { type: mongoose.Schema.Types.ObjectId, ref: "books", required: true },
        quantity: { type: Number, default: 1 },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Cart = mongoose.model("Cart", cartSchema);
