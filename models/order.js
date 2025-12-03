
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
      required: true,
    },

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


