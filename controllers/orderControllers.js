import { validationResult } from "express-validator";
import HttpError from "../helpers/httpError.js";
import { Order } from "../models/order.js";


export const orderItems = async (req, res, next) => {
  try {
    const error = validationResult(req)
    if(!error.isEmpty()){
        return next(new HttpError("Invalid User Input", 500));
    }
    else{

       const {userId,userRole} = req.userData 
       if(userRole !=="customer"){
          
       }


    }
    const { items } = req.body;   
    const {userId} = req.userData

   
 
  
    const newOrder = new Order({
      user: userId,
      items: items.map(item => ({
        book: item.book,
        quantity: item.quantity || 1,
        orderedAt: new Date(),
        price: item.price || null
      })),
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
