import express from 'express'
import userAuthCheck from '../middleware/authCheck.js'
import { getSellerOrders, getUserOrders, orderItems } from '../controllers/orderControllers.js'
import { check } from 'express-validator'

const orderRoutes = express.Router()

orderRoutes.use(userAuthCheck)

orderRoutes.post(
  '/orderitems',
  [
    check('items').isArray({ min: 1 }).withMessage('Items array is required'),
    check('items.*.quantity')
      .notEmpty().withMessage('Quantity is required')
      .isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    check('items.*.price')
      .notEmpty().withMessage('Price is required')
      .isFloat({ min: 1 }).withMessage('Price must be a positive number'),
      check('address.fullName').notEmpty().withMessage('Full name is required'),
check('address.phone').notEmpty().withMessage('Phone is required'),
check('address.addressLine1').notEmpty().withMessage('Address Line 1 is required'),
check('address.city').notEmpty().withMessage('City is required'),
check('address.state').notEmpty().withMessage('State is required'),
check('address.pinCode').notEmpty().withMessage('PIN Code is required'),

  ],
  orderItems
);

orderRoutes.get('/getallorder', getUserOrders);
orderRoutes.get('/sellerorder', getSellerOrders);


export default orderRoutes