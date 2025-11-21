import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: true,
    },

    items: [
      {
        book: {
          type: mongoose.Types.ObjectId,
          ref: "books",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        orderedAt: {
          type: Date,
          default: Date.now,
        },
        price: Number,  
      },
    ],

    status: {
      type: String,
      enum: ["ordered", "completed", "cancelled"],
      default: "ordered",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
