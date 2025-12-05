import { validationResult } from "express-validator";
import HttpError from "../helpers/httpError.js";
import { Order } from "../models/order.js";


export const orderItems = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    console.log(errors)

    if (!errors.isEmpty()) {
      return next(new HttpError("Invalid User Input", 400));
    }
    else{
      const { userId, userRole } = req.userData;
    if (userRole !== "customer") {
      return next(new HttpError("Only customers can place orders", 403));
    }else{
      const { items, address } = req.body;

   
    const totalQty = items.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0
    );

    const totalAmount = items.reduce(
      (sum, item) => sum + (item.price * (item.quantity || 1)),
      0
    );

    
    const newOrder = new Order({
      user: userId,
      items: items.map((item) => ({
        book: item.book,   
        quantity: item.quantity ,
        orderedAt: new Date(),
        price: item.price 
      })),
      address: [address],
      totalQty,       
      totalAmount,     
    });

    await newOrder.save();

    res.status(201).json({
      success:true,
      message: "Order placed successfully",
    }); }
    }
  } catch (error) {
    return next(new HttpError(error.message || "Order failed", 500));
  }
};





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

    const orders = await Order.find()
      .populate({
        path: "items.book",
        model: "Book",
        populate: { path: "user", model: "User" } 
      })
      .sort({ createdAt: -1 });

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




export const cancelOrderItem = async (req, res, next) => {
  try {
    const { userId, userRole } = req.userData;
    const { orderId, itemId } = req.params;

    // Only customers can cancel
    if (userRole !== "customer") {
      return next(new HttpError("Only customers can cancel items", 403));
    }

    if (!orderId || !itemId) {
      return next(new HttpError("Order ID & Item ID required", 400));
    }

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      return next(new HttpError("Order not found", 404));
    }

    // Ensure user owns this order
    if (order.user.toString() !== userId) {
      return next(new HttpError("You are not allowed to cancel this order", 403));
    }

    // Find the specific item
    const item = order.items.id(itemId);
    if (!item) {
      return next(new HttpError("Order item not found", 404));
    }

    // Prevent cancelling shipped or delivered items
    if (["shipped", "delivered"].includes(item.status)) {
      return next(new HttpError("This item cannot be cancelled now", 400));
    }

    // Already cancelled?
    if (item.status === "cancelled") {
      return next(new HttpError("This item is already cancelled", 400));
    }

    // ❌ Cancel this item
    item.status = "cancelled";
    item.cancelledAt = new Date();

    // 🟡 Update order.status based on items
    const allCancelled = order.items.every(i => i.status === "cancelled");
    const someCancelled = order.items.some(i => i.status === "cancelled");

    if (allCancelled) {
      order.status = "cancelled";
      order.cancelledAt = new Date();
    } else if (someCancelled) {
      order.status = "partially_cancelled";
    } else {
      order.status = "ordered";
    }

    await order.save();

    return res.status(200).json({
      message: "Item cancelled successfully",
      order,
    });

  } catch (error) {
    return next(new HttpError(error.message || "Unable to cancel item", 500));
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






export const getSavedAddress = async (req, res, next) => {
  try {
    const { userId, userRole } = req.userData;

    if (userRole !== "customer") {
      return next(new HttpError("Only customers can view addresses", 403));
    }

    // Fetch the latest order
    const latestOrder = await Order.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .select("address");

    if (!latestOrder || !latestOrder.address || latestOrder.address.length === 0) {
      return next(new HttpError("No addresses found", 404));
    }

    // Return addresses in descending order (latest first)
    const addresses = latestOrder.address
      .map(addr => ({ ...addr.toObject() })) // convert Mongoose subdocs to plain objects
      .sort((a, b) => new Date(b._id.getTimestamp()).getTime() - new Date(a._id.getTimestamp()).getTime());

    return res.status(200).json({
      success: true,
      message: "Addresses fetched successfully",
      addresses, // array of addresses
    });

  } catch (err) {
    console.error(err);
    return next(new HttpError(err.message || "Failed to fetch addresses", 500));
  }
};


// upadateaddress


export const updateAddress = async (req, res, next) => {
  try {
    const { userId, userRole } = req.userData;
    const { addressId, updatedAddress } = req.body;

    if (userRole !== "customer") {
      return next(new HttpError("Only customers can update address", 403));
    }

    if (!updatedAddress) {
      return next(new HttpError("Address data is required", 400));
    }

    const order = await Order.findOne({ user: userId });

    if (!order) {
      return next(new HttpError("Order not found for this user", 404));
    }

    // UPDATE existing address
    if (addressId) {
      const addressIndex = order.address.findIndex(a => a._id.toString() === addressId);
      if (addressIndex === -1) {
        return next(new HttpError("Address not found", 404));
      }
      order.address[addressIndex] = {
        ...order.address[addressIndex].toObject(),
        ...updatedAddress,
      };
      await order.save();
      return res.status(200).json({
        success: true,
        message: "Address updated successfully",
        addresses: order.address, // return full array
      });
    }

    // ADD new address
    order.address.push(updatedAddress);
    await order.save();
    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      addresses: order.address, // return full array
    });
  } catch (err) {
    console.error(err);
    return next(new HttpError(err.message || "Failed to update/add address", 500));
  }
};
