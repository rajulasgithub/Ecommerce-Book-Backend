import mongoose from "mongoose";
import HttpError from "../helpers/httpError.js";
import { Cart } from "../models/cart.js";

// add to cart
export const addToCart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, userRole } = req.userData;

    if (userRole !== "customer") {
      return next(new HttpError("Only customers can add books to cart", 403));
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(new HttpError("Invalid or missing Book ID", 400));
    }

    
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
      });
    }

  
    const existingItem = cart.items.find(
      (item) => item.book.toString() === id
    );

    if (existingItem) {
    
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
    
      cart.items.push({
        book: id,
        quantity: 1,
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: existingItem
        ? "Book quantity updated in cart"
        : "Book added to cart",
      cart,
    });

  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};



// listing all cart items
export const getCartItems = async (req, res, next) => {
  try {
    const { userId, userRole } = req.userData;

    if (userRole !== "customer") {
      return next(new HttpError("Only customers can get cart items", 403));
    }

    const { page = 1, limit = 10 } = req.query; // get page & limit from query params
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const cart = await Cart.findOne({ user: userId }).populate("items.book");

    if (!cart || cart.items.length === 0) {
      return next(new HttpError("Cart is empty", 400));
    }

    // Pagination logic
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginatedItems = cart.items.slice(startIndex, endIndex).map((item) => ({
      bookId: item.book._id,
      title: item.book.title,
      prize: item.book.prize,
      genre: item.book.genre,
      image: item.book.image,
      quantity: item.quantity,
    }));

    const totalItems = cart.items.length;
    const totalPages = Math.ceil(totalItems / limitNum);

    return res.status(200).json({
      success: true,
      message: "Cart items retrieved successfully",
      data: paginatedItems,
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};




// removeCartItem
export const removeCartItem = async (req, res, next) => {
  try {  
    const {userId, userRole } = req.userData
    if(userRole !== "customer"){
       return next(new HttpError("Only customer can remove from cart ", 403));
    }
    else{
      const {id} = req.params;

       if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(new HttpError("Invalid or missing book id", 400));
    } 
    else {
      const cart = await Cart.findOne({user:userId});

      if (!cart) {
        return next(new HttpError("Cart is Empty", 400));
      } 
      else {
        const itemIndex = cart.items.findIndex(
          (item) => item.book.toString() === id
        );

        if (itemIndex === -1) {
          return next(new HttpError("Book Not Found In the Cart", 404));
        } 
        else {
          cart.items.splice(itemIndex, 1);
          await cart.save();

          return res.status(200).json({
            success: true,
            message: "Book removed from cart",
          });
        }
      }
    }

    }
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};




// clear the cart
export const clearCart = async (req, res, next) => {
  try {
    const {userId,userRole} = req.userData
    

    if(userRole !=="customer"){
          return next(new HttpError("Only customer can clear cart", 403));
    }
    else{
      const cart = await Cart.findOne({user:userId});

    if (!cart || cart.items.length === 0) {
      return next(new HttpError("Cart is already empty", 400));
    } 
    else {
      cart.items = [];
      await cart.save();

      return res.status(200).json({
        success: true,
        message: "All items removed from cart",
      });
    }
    }
    
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};


// upadte quantity
export const updateQuantity = async (req, res, next) => {
  try {
   
    const {userId,userRole }= req.userData
  
    if(userRole !== "customer"){
         return next(new HttpError("Only customer can update cart", 403));
    }

    else{
    const { id } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOneAndUpdate(
      { user:userId, "items.book": id },
      { $set: { "items.$.quantity": quantity } },
    ).populate("items.book");

    if (!cart) {
      return next(new HttpError("Cart not found", 404));
    } 
    else {
      return res.status(200).json({
        success: true,
        message: "Quantity updated successfully",
      });
    }
    }

  } catch (error) {
   return next(new HttpError(error.message, 500));
  }
};
