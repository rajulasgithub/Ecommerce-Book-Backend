
import mongoose from 'mongoose'

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
          
        status: {
          type: String,
          enum: ["ordered", "cancelled", "shipped", "delivered"],
          default: "ordered",
        },
        cancelledAt: {
          type: Date,
          default: null,
        },
      },
      
    ],

    totalQty: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

   address: [
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },
  }
],

    paymentMethod: {
      type: String,
      enum: ["upi", "card", "netbanking", "cod"],
      default: "cod",
    },

    // status: {
    //   type: String,
    //   enum: ["ordered", "cancelled", "delivered"],
    //   default: "ordered",
    // },
    
    cancelledAt: {
      type: Date,
      default: null,
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


