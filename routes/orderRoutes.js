import express from 'express'
import userAuthCheck from '../middleware/authCheck.js'
import { orderItems } from '../controllers/orderControllers.js'
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
      .isFloat({ min: 1 }).withMessage('Price must be a positive number')

  ],
  orderItems
);


export default orderRoutes