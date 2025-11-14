import express from 'express'
import {userRegister, userLogin } from '../controllers/authController.js'
import checkAuth from '../middleware/authCheck.js'

const authRoutes = express.Router()

authRoutes.post('/register', userRegister)

authRoutes.post('/login',userLogin )

export default authRoutes       