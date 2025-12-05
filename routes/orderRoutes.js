import express from 'express'
import userAuthCheck from '../middleware/authCheck.js'
import { getSellerOrders, getUserOrders, orderItems, deleteAddress, getSellerOrderDetails, cancelOrderItem, getSavedAddress, updateAddress, addAddress } from '../controllers/orderControllers.js'
import { check } from 'express-validator'

const orderRoutes = express.Router()

orderRoutes.use(userAuthCheck)

orderRoutes.post(
  '/orderitems',
  [
    check('items')
      .isArray({ min: 1 })
      .withMessage('Items array is required'),

    check('items.*.book')
      .notEmpty().withMessage('Book ID is required')
      .isMongoId().withMessage('Invalid Book ID'),

    check('items.*.quantity')
      .notEmpty().withMessage('Quantity is required')
      .isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),

    check('items.*.price')
      .notEmpty().withMessage('Price is required')
      .isFloat({ min: 1 }).withMessage('Price must be a positive number'),
      
    check('address.fullName').notEmpty().withMessage('Full name is required'),
    check('address.phone').notEmpty().withMessage('Phone is required'),
    check('address.addressLine1').notEmpty().withMessage('Address Line 1 is required'),
    check('address.addressLine2').notEmpty().withMessage('Address Line 2 is required'),
    check('address.city').notEmpty().withMessage('City is required'),
    check('address.state').notEmpty().withMessage('State is required'),
    check('address.pinCode').notEmpty().withMessage('PIN Code is required'),
  ],
  orderItems
);


orderRoutes.get('/getallorder', getUserOrders);
orderRoutes.get('/sellerorder', getSellerOrders);
orderRoutes.patch('/cancelorder/:orderId/:itemId', cancelOrderItem);
orderRoutes.get('/sellerorderdetail/:orderId', getSellerOrderDetails);
orderRoutes.get("/address",getSavedAddress);
orderRoutes.patch("/updateaddress",updateAddress);
orderRoutes.post("/addaddress",addAddress);
orderRoutes.delete("/deleteaddress/:id",deleteAddress);


export default orderRoutes