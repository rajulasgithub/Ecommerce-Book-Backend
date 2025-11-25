import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        book: {
          type: mongoose.Types.ObjectId,
          ref: "Book",
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

   address: {
  type: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pinCode: String,
  },
  required: true, // address object must exist
},
     paymentMethod: {
      type: String,
      enum: ["upi", "card", "netbanking", "cod","COD"],
      default:"COD"
    },

    status: {
      type: String,
      enum: ["ordered", "completed", "cancelled"],
      default: "ordered",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "paid",
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
