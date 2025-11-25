import { validationResult } from "express-validator";
import HttpError from "../helpers/httpError.js";
import { Order } from "../models/order.js";


export const orderItems = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new HttpError("Invalid User Input", 400));
    }

    const { userId, userRole } = req.userData;
    if (userRole !== "customer") {
      return next(new HttpError("Only customers are allowed to order items", 403));
    }

    const { items, address, paymentMethod } = req.body;
    console.log(req.body)

    // Validate that address exists
    if (!address || !address.fullName || !address.phone || !address.addressLine1 || !address.city || !address.state || !address.pinCode) {
      return next(new HttpError("Address is incomplete", 400));
    }

    const newOrder = new Order({
      user: userId,
      items: items.map(item => ({
        book: item.bookId,
        quantity: item.quantity || 1,
        orderedAt: new Date(),
        price: item.price || null
      })),
      address,       
      paymentMethod, 
    });

    const savedOrder = await newOrder.save();
    const populatedOrder = await savedOrder.populate("items.book");

    res.status(201).json({
      message: "Order placed successfully",
      order: populatedOrder,
    });
  } catch (error) {
    return next(new HttpError(error.message || "Order failed", 500));
  }
};



// getallorders


export const getUserOrders = async (req, res, next) => {
  try {

    const { userId, userRole } = req.userData;

    if (userRole !== "customer") {
      return next(new HttpError("Only customers can view orders", 403));
    }
    else{

       const orders = await Order.find({ user: userId })
      .populate("items.book")   
      .sort({ createdAt: -1 });  

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        message: "No orders found",
        orders: [],
      });
    }
    else{
   res.status(200).json({
      message: "Orders fetched successfully",
      orders,
    });
    }

   
    }

  } catch (error) {
    return next(new HttpError(error.message || "Unable to fetch orders", 500));
  }
};



// sellerorders

export const getSellerOrders = async (req, res, next) => {
  try {
    const { userId, userRole } = req.userData;

    if (userRole !== "seller") {
      return next(new HttpError("Only sellers can view orders for their books", 403));
    }

    // Fetch all orders and populate the book and its user (seller)
    const orders = await Order.find()
      .populate({
        path: "items.book",
        model: "Book",
        populate: { path: "user", model: "User" } // book.user is the seller
      })
      .sort({ createdAt: -1 });

    // Filter orders: keep only items belonging to this seller
    const sellerOrders = orders.filter(order =>
      order.items.some(item =>
        item.book?.user?._id?.toString() === userId
      )
    );

    return res.status(200).json({
      message: "Seller orders fetched successfully",
      orders: sellerOrders,
    });

  } catch (error) {
    return next(new HttpError(error.message || "Unable to fetch seller orders", 500));
  }
};
