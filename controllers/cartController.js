import { Cart } from "../models/cart.js";


export const addToCart = async (req, res, next) => {
  try {
    const bookId = req.params.id;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Book ID is required",
      });
    }

   
    let cart = await Cart.findOne();
    if (!cart) {
      cart = new Cart({ items: [] });
    }

    const itemIndex = cart.items.findIndex(
  (item) => item.book.toString() === bookId
);

if (itemIndex > -1) {

  return res.status(200).json({
    success: false,
    message: "Book is already in the cart",
  
  });
} else {
  
  cart.items.push({ book: bookId }); 
  await cart.save();

  return res.status(200).json({
    success: true,
    message: "Book added to cart",
   
  });
}
  } catch (error) {
    next(error);
  }
};



// listing all cart items

export const getCartItems = async (req, res, next) => {
  try {
   
    const cart = await Cart.findOne().populate("items.book");

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        data: [],
      });
    }

    else{
  const cartItems = cart.items.map((item) => ({
      bookId: item.book._id,
      title: item.book.title,
      prize: item.book.prize,
      genre: item.book.genre,
      image: item.book.image,
      quantity: item.quantity,
 
    }));

    return res.status(200).json({
      success: true,
      message: "Cart items retrieved successfully",
      data: cartItems,
    });
    }
    
  
  } catch (error) {
    console.error("Error fetching cart items:", error);
    next(error);
  }
};


// removeCartItem


export const removeCartItem = async (req, res, next) => {
  try {
    const bookId = req.params.id;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "Book ID is required",
      });
    }

    
    const cart = await Cart.findOne();

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }
    else{

        const itemIndex = cart.items.findIndex(
      (item) => item.book.toString() === bookId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Book not found in the cart",
      });
    }
    else{
cart.items.splice(itemIndex, 1);
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Book removed from cart",
      data: cart.items,
    });
    }
      
    }

    
  

 
    
  } catch (error) {
    console.error("Error removing cart item:", error);
    next(error);
  }
};


// clear the cart


export const clearCart = async (req, res, next) => {
  try {
   
    const cart = await Cart.findOne();

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Cart is already empty",
        data: [],
      });
    }
    else{
   cart.items = [];
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "All items removed from cart",
      data: cart.items, 
    });
    }

   
   
  } catch (error) {
    console.error("Error clearing cart:", error);
    next(error);
  }
};



// upadte quantity

export const updateQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    console.log(id,quantity)

  
    const cart = await Cart.findOneAndUpdate(
      { "items.book": id },
      { $set: { "items.$.quantity": quantity } },
      { new: true }
    ).populate("items.book"); 

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }
    else{
  res.status(200).json({
      success: true,
      message: "Quantity updated successfully",
      data: cart,
    });
    }
  
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating quantity",
      error: error.message,
    });
  }
};
