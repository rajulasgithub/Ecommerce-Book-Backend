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
      return next(new HttpError("Only customers can place orders", 403));
    }

    const { items, address, paymentMethod } = req.body;

    // Address Validation
    if (
      !address ||
      !address.fullName ||
      !address.phone ||
      !address.addressLine1 ||
      !address.city ||
      !address.state ||
      !address.pinCode
    ) {
      return next(new HttpError("Address is incomplete", 400));
    }

    // Calculate totals
    const totalQty = items.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0
    );

    const totalAmount = items.reduce(
      (sum, item) => sum + (item.price * (item.quantity || 1)),
      0
    );

    // Create order
    const newOrder = new Order({
      user: userId,
      items: items.map((item) => ({
        book: item.book,    // Must be book id
        quantity: item.quantity || 1,
        orderedAt: new Date(),
        price: item.price || 0,
      })),
      address,
      paymentMethod,
      totalQty,        // NEW FIELD
      totalAmount,     // NEW FIELD
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




export const cancelOrder = async (req, res, next) => {
  try {
    const { userId, userRole } = req.userData;
    const { orderId } = req.params;

    // Only customers can cancel
    if (userRole !== "customer") {
      return next(new HttpError("Only customers can cancel orders", 403));
    }
    else{
      // Validate orderId
    if (!orderId) {
      return next(new HttpError("Order ID is required", 400));
    }

    // Find order
    const order = await Order.findById(orderId).populate("items.book");

    if (!order) {
      return next(new HttpError("Order not found", 404));
    }

    // Make sure user owns this order
    if (order.user.toString() !== userId) {
      return next(new HttpError("You are not allowed to cancel this order", 403));
    }

    // Optional — Prevent cancelling after shipped/delivered
    if (["shipped", "delivered"].includes(order.status)) {
      return next(
        new HttpError("Order cannot be cancelled after it has been shipped", 400)
      );
    }

    // If already cancelled
    if (order.status === "cancelled") {
      return next(new HttpError("Order is already cancelled", 400));
    }

    // Cancel it
    order.status = "cancelled";
    order.cancelledAt = new Date();

    const updatedOrder = await order.save();

    return res.status(200).json({
      message: "Order cancelled successfully",
      order: updatedOrder,
    });

    }

    
  } catch (error) {
    return next(new HttpError(error.message || "Unable to cancel order", 500));
  }
};




export const getSellerOrderDetails = async (req, res, next) => {
  try {
    const { userId, userRole } = req.userData;
    const { orderId } = req.params;

    if (userRole !== "seller") {
      return next(new HttpError("Only sellers can view order details", 403));
    }

    if (!orderId) {
      return next(new HttpError("Order ID is required", 400));
    }

    // Fetch the order and populate books + book seller
    const order = await Order.findById(orderId).populate({
      path: "items.book",
      model: "Book",
      populate: { path: "user", model: "User" }, // seller info
    });

    if (!order) {
      return next(new HttpError("Order not found", 404));
    }

    // Filter items belonging to this seller
    const sellerItems = order.items.filter(
      (item) => item.book?.user?._id?.toString() === userId
    );

    if (sellerItems.length === 0) {
      return next(
        new HttpError("You do not have any products in this order", 403)
      );
    }

    return res.status(200).json({
      message: "Order details fetched successfully",
      order: {
        _id: order._id,
        customer: order.user,
        address: order.address,
        paymentMethod: order.paymentMethod,
        status: order.status,
        createdAt: order.createdAt,
        items: sellerItems, // only items belonging to seller
      },
    });
  } catch (error) {
    return next(
      new HttpError(error.message || "Unable to fetch order details", 500)
    );
  }
};
