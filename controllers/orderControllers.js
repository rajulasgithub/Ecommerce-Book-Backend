import { validationResult } from "express-validator";
import HttpError from "../helpers/httpError.js";
import { Order } from "../models/order.js";
import { Address } from "../models/address.js";
import mongoose from "mongoose";


export const orderItems = async (req, res, next) => {
  try {
    console.log(req.body)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new HttpError("Invalid User Input", 400));
    }
    else {
      const { userId, userRole } = req.userData;

      if (userRole !== "customer") {
        return next(new HttpError("Only customers can place orders", 403));
      }
      else {
        const { items, address } = req.body;
        const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const totalAmount = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        const newOrder = new Order({
          user: userId,
          items: items.map((item) => ({
            book: item.book,
            quantity: item.quantity,
            orderedAt: new Date(),
            price: item.price,
          })),
          address: address,
          totalQty,
          totalAmount,
        });

        await newOrder.save();

        res.status(201).json({
          success: true,
          message: "Order placed successfully",
        });

      }
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

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 8);
    const skip = (page - 1) * limit;

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const pipeline = [
      { $match: { user: userObjectId } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "books",
          localField: "items.book",
          foreignField: "_id",
          as: "bookDetails",
        },
      },
      { $unwind: "$bookDetails" },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          "items._id": 1,
          "items.quantity": 1,
          "items.price": 1,
          "items.status": 1,
          "items.cancelledAt": 1,
          book: {
            _id: "$bookDetails._id",
            title: "$bookDetails.title",
            author: "$bookDetails.author",
            image: "$bookDetails.image",
            price: "$bookDetails.price",
          },
          paymentMethod: 1,
          totalAmount: 1,
          address: 1,
        },
      },
    ];

    const orderItems = await Order.aggregate(pipeline);

    const countPipeline = [
      { $match: { user: userObjectId } },
      { $unwind: "$items" },
      { $count: "totalItems" },
    ];

    const countResult = await Order.aggregate(countPipeline);

    const totalItems = countResult[0]?.totalItems || 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return res.status(200).json({
      message:
        totalItems === 0
          ? "No order items found"
          : "Order items fetched successfully",
      orderItems,
      page,
      limit,
      totalPages,
      totalItems,
    });
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
    else {
      const orders = await Order.find()
        .populate({
          path: "items.book",
          model: "Book",

          populate: {
            path: "user",
            model: "User",
            select: "firstName lastName email phone _id",
          },
        })
        .populate({
          path: "user",
          model: "User",
          select: "firstName lastName email phone _id",
        })
        .sort({ createdAt: -1 })
        .lean();

      const sellerOrders = orders
        .map((order) => {

          const sellerItems = (order.items || []).filter((item) => {

            const bookUserId = book?.user?._id ?? book?.user ?? null;
            if (!bookUserId) {

              return false;
            }
            return String(bookUserId) === String(userId);
          });


          if (!sellerItems.length) return null;


          return {
            ...order,
            items: sellerItems,
          };
        })
        .filter(Boolean);

      return res.status(200).json({
        message: "Seller orders fetched successfully",
        orders: sellerOrders,
      });

    }

  } catch (error) {
    console.error("getSellerOrders error:", error);
    return next(new HttpError(error.message || "Unable to fetch seller orders", 500));
  }
};



export const updateOrderItemStatus = async (req, res, next) => {
  try {
    const { userId, userRole } = req.userData;
    const { orderId, itemId } = req.params;
    const { action } = req.body;

    console.log("IDs:", orderId, itemId);

    if (!orderId || !itemId || !action) {
      return next(new HttpError("Order ID, Item ID and new status are required", 400));
    }

    const order = await Order.findById(orderId);
    if (!order) return next(new HttpError("Order not found", 404));
    console.log(order)

    const item = order.items.id(itemId);
    if (!item) return next(new HttpError("Order item not found", 404));

    // Customer logic
    if (userRole === "customer") {
      if (order.user.toString() !== userId) {
        
        return next(new HttpError("You are not allowed to modify this order", 403));
      }

      if (action !== "cancelled") {
        return next(new HttpError("Customers can only cancel items", 403));
      }

      if (["dispatched", "delivered"].includes(item.status)) {
        return next(new HttpError("Cannot cancel dispatched/delivered items", 400));
      }

      if (item.status === "cancelled") {
        return next(new HttpError("This item is already cancelled", 400));
      }
    }

    // Seller logic (optional, if needed)
    if (userRole === "seller") {
      if (item?.book?.user.toString() !== userId) {
        return next(new HttpError("This item does not belong to you", 403));
      }

      if (action === "cancelled" && ["dispatched", "delivered"].includes(item.status)) {
        return next(new HttpError("Cannot cancel dispatched/delivered items", 400));
      }
    }

    // Update item status
    item.status = action;
    if (action === "cancelled") item.cancelledAt = new Date();
    if (action === "dispatched") item.dispatchedAt = new Date();
    if (action === "delivered") item.deliveredAt = new Date();

    // Update overall order status based on items
    const statuses = order.items.map(i => i.status);

    if (statuses.every(s => s === "cancelled")) {
      order.status = "cancelled";
    } else if (statuses.every(s => s === "delivered")) {
      order.status = "delivered";
    } else if (statuses.every(s => ["dispatched", "delivered"].includes(s))) {
      order.status = "dispatched";
    } else if (statuses.some(s => s === "cancelled")) {
      order.status = "partially_cancelled";
    } else if (statuses.some(s => s === "dispatched")) {
      order.status = "partially_dispatched";
    } else if (statuses.some(s => s === "delivered")) {
      order.status = "partially_delivered";
    } else {
      order.status = "ordered";
    }

    await order.save();

    return res.status(200).json({
      message: "Order item status updated successfully",
      order,
    });

  } catch (error) {
    console.error(error);
    return next(
      new HttpError(error.message || "Unable to update item status", 500)
    );
  }
};




export const getSellerOrderDetails = async (req, res, next) => {
  try {
    const { userId, userRole } = req.userData;

    if (userRole !== "seller") {
      return next(new HttpError("Only sellers can view order details", 403));
    }
    else {
      const { orderId } = req.params;


      if (!orderId) {
        return next(new HttpError("Order ID is required", 400));
      }
      else {
        const order = await Order.findById(orderId)
          .populate({
            path: "items.book",
            model: "Book",
            populate: { path: "user", model: "User" },
          })
          .populate("user", "firstName lastName email fullPhone");

        if (!order) {
          return next(new HttpError("Order not found", 404));
        }
        else {
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


              customer: {
                name: `${order.user.firstName} ${order.user.lastName}`,
                email: order.user.email,
                phone: order.user.fullPhone,
              },

              address: order.address,
              paymentMethod: order.paymentMethod,
              paymentStatus: order.paymentStatus,
              status: order.status,
              createdAt: order.createdAt,
              items: sellerItems,
            },
          });
        }
      }
    }

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
    else {
      const addresses = await Address.find({ user: userId }).sort({ createdAt: -1 });

      if (!addresses || addresses.length === 0) {
        return next(new HttpError("No addresses found", 404));
      }
      else {
        return res.status(200).json({
          success: true,
          message: "Addresses fetched successfully",
          addresses,
        });
      }
    }
  } catch (err) {

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
    else {
      if (!addressId) {
        return next(new HttpError("Address ID is required for updating", 400));
      }
      else {
        if (!updatedAddress || typeof updatedAddress !== "object" || Object.keys(updatedAddress).length === 0) {
          return next(new HttpError("Updated address data is required", 400));
        }
        else {
          let userAddresses = await Address.findOne({ user: userId });


          if (!userAddresses) {
            userAddresses = new Address({ user: userId, addresses: [] });
          }
          else {
            const addrIndex = userAddresses.addresses.findIndex(a => a._id && a._id.toString() === addressId.toString());
            if (addrIndex === -1) {
              return next(new HttpError("Address not found for this user", 404));
            }

            const allowedFields = ["fullName", "phone", "addressLine1", "addressLine2", "city", "state", "pinCode"];
            for (const key of allowedFields) {
              if (Object.prototype.hasOwnProperty.call(updatedAddress, key)) {
                userAddresses.addresses[addrIndex][key] = updatedAddress[key];
              }
            }

            userAddresses.markModified(`addresses.${addrIndex}`);
            await userAddresses.save();

            const ordersWithAddress = await Order.find({ "address._id": addressId });

            if (Array.isArray(ordersWithAddress) && ordersWithAddress.length > 0) {
              for (const order of ordersWithAddress) {
                const idx = order.address.findIndex(a => a._id && a._id.toString() === addressId.toString());
                if (idx !== -1) {

                  for (const key of allowedFields) {
                    if (Object.prototype.hasOwnProperty.call(updatedAddress, key)) {
                      order.address[idx][key] = updatedAddress[key];
                    }
                  }
                  order.markModified(`address.${idx}`);
                  await order.save();
                }
              }
            }
            const refreshed = await Address.findOne({ user: userId }).select("addresses -_id");
            return res.status(200).json({
              success: true,
              message: "Address updated successfully",
              addresses: refreshed ? refreshed.addresses : [],
            });
          }

        }

      }

    }

  } catch (err) {
    console.error("updateAddress error:", err);
    if (err.name === "ValidationError") {
      return next(new HttpError(err.message || "Validation failed", 400));
    }
    return next(new HttpError(err.message || "Failed to update address", 500));
  }
};



export const addAddress = async (req, res, next) => {
  try {
    const { userId, userRole } = req.userData;
    const updatedAddress =
      req.body.updatedAddress ?? req.body.newAddress ?? req.body;

    if (userRole !== "customer") {
      return next(new HttpError("Only customers can add address", 403));
    }
    else {
      if (!updatedAddress || typeof updatedAddress !== "object" || Object.keys(updatedAddress).length === 0) {
        return next(new HttpError("Address data is required (received empty payload)", 400));
      }
      else {
        const { fullName, phone, addressLine1, addressLine2, city, state, pinCode } = updatedAddress;
        if (!fullName || !phone || !addressLine1) {
          return next(new HttpError("fullName, phone and addressLine1 are required", 400));
        }

        let addressDoc = await Address.findOne({ user: userId })

        if (!addressDoc) {
          addressDoc = new Address({
            user: userId,
            addresses: [],
          });
        }
        const maxAddresses = 3;
        if (Array.isArray(addressDoc.addresses) && addressDoc.addresses.length >= maxAddresses) {
          return next(new HttpError(`You can save up to ${maxAddresses} addresses only`, 400));
        }
        addressDoc.addresses.push({
          fullName,
          phone,
          addressLine1,
          addressLine2,
          city,
          state,
          pinCode,
        });

        await addressDoc.save();
        const addedAddress = addressDoc.addresses[addressDoc.addresses.length - 1];
        try {
          const latestOrder = await Order.findOne({ user: userId }).sort({ createdAt: -1 });
          if (latestOrder) {

            latestOrder.address.push({
              fullName,
              phone,
              addressLine1,
              addressLine2,
              city,
              state,
              pinCode,
            });
            await latestOrder.save();
          }
        } catch (orderErr) {

          console.error("Warning: failed to also push address into Order.address snapshot:", orderErr);
        }

        return res.status(201).json({
          success: true,
          message: "Address added successfully",
          addresses: addressDoc.addresses,
          addedAddress,
        });
      }
    }
  } catch (err) {

    if (err.name === "ValidationError") {
      return next(new HttpError(err.message || "Validation failed", 400));
    }
    return next(new HttpError(err.message || "Failed to add address", 500));
  }
};


// deleteaddress
export const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, userRole } = req.userData;
    if (userRole !== "customer") {
      return next(new HttpError("Only customers can delete addresses", 403));
    }
    if (!id) {
      return next(new HttpError("Address ID is required", 400));
    }
    else {
      const userAddressDoc = await Address.findOne({ user: userId });
      if (!userAddressDoc) {
        return next(new HttpError("Address document not found for this user", 404));
      }
      else {
        const initialLength = userAddressDoc.addresses.length;
        userAddressDoc.addresses = userAddressDoc.addresses.filter(
          (addr) => addr._id.toString() !== id
        );

        if (userAddressDoc.addresses.length === initialLength) {
          return next(new HttpError("Address not found", 404));
        }

        await userAddressDoc.save();

        res.status(200).json({
          success: true,
          message: "Address deleted successfully",
          addresses: userAddressDoc.addresses,
        });
      }
    }
  }
  catch (err) {
    console.error("Delete address error:", err);
    next(new HttpError(err.message || "Failed to delete address", 500));
  }
};