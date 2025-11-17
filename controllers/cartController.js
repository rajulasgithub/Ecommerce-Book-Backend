import HttpError from "../helpers/httpError.js";
import { Cart } from "../models/cart.js";

// add to cart
export const addToCart = async (req, res, next) => {
  try {
    const bookId = req.params.id;
    const user= req.userData.userId
    const role= req.userData.userRole

   if(role !== "customer"){
    return next(new HttpError("Only customers  can add books to cart", 403));
   }
   else{
     if (!bookId) {
      return next(new HttpError("Book ID is required", 400));
    } 
    else {
      let cart = await Cart.findOne({user}) || new Cart({user, items: [] });

      const alreadyExists = cart.items.some(
        (item) => item.book.toString() === bookId
      );

      if (alreadyExists) {
        return next(new HttpError("Book is already in the cart", 400));
      } 
      else {
        cart.items.push({ book: bookId });
        await cart.save();

        return res.status(200).json({
          success: true,
          message: "Book added to cart",
          cart
        });
      }
    }

   }

   
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};

// listing all cart items
export const getCartItems = async (req, res, next) => {
  try {
    const user = req.userData.userId
    const role = req.userData.userRole
if(role !=="customer"){
   return next(new HttpError("Only customers can get cart items ", 403));
}
else{
 const cart = await Cart.findOne({user}).populate("items.book");

    if (!cart || cart.items.length === 0) {
      return next(new HttpError("Cart is empty", 400));
    } 
    else {
      const cartItems = cart.items.map((item) => ({
        bookId: item.book._id,
        title: item.book.title,
        prize: item.book.prize,
        genre: item.book.genre,
        image: item.book.image,
        quantity: item.quantity
      }));

      if (cartItems) {
        return res.status(200).json({
          success: true,
          message: "Cart items retrieved successfully",
          data: cartItems
        });
      } 
      else {
        return next(new HttpError("Cart items not found", 404));
      }
    }
}

   
  } catch (error) {
     return next(new HttpError(error.message, 500));
  }
};

// removeCartItem
export const removeCartItem = async (req, res, next) => {
  try {
    const bookId = req.params.id;
    const user = req.userData.userId
    const role = req.userData.userRole

    if(role !== "customer"){
       return next(new HttpError("Only customer can remove from cart ", 403));
    }
    else{
       if (!bookId) {
      return next(new HttpError("Book ID is required", 400));
    } 
    else {
      const cart = await Cart.findOne({user});

      if (!cart) {
        return next(new HttpError("Cart is Empty", 400));
      } 
      else {
        const itemIndex = cart.items.findIndex(
          (item) => item.book.toString() === bookId
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
            data: cart.items
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
    const user = req.userData.userId
    const role = req.userData.userRole

    if(role !=="customer"){
          return next(new HttpError("Only customer can clear cart", 403));
    }
    else{
      const cart = await Cart.findOne({user});

    if (!cart || cart.items.length === 0) {
      return next(new HttpError("Cart is already empty", 400));
    } 
    else {
      cart.items = [];
      await cart.save();

      return res.status(200).json({
        success: true,
        message: "All items removed from cart",
        data: cart.items
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
    const { id } = req.params;
    const { quantity } = req.body;
    const user = req.userData.userId
    const role = req.userData.userRole

    if(role !== "customer"){
         return next(new HttpError("Only customer can update cart", 403));
    }
    else{
 const cart = await Cart.findOneAndUpdate(
      { user, "items.book": id },
      { $set: { "items.$.quantity": quantity } },
      { new: true }
    ).populate("items.book");

    if (!cart) {
      return next(new HttpError("Cart not found", 404));
    } 
    else {
      return res.status(200).json({
        success: true,
        message: "Quantity updated successfully",
        data: cart
      });
    }
    }

   
  } catch (error) {
   return next(new HttpError(error.message, 500));
  }
};
