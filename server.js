import express from 'express'
import dotenv from 'dotenv'
import bookRoutes from './routes/bookRoutes.js'
import { connectDB } from './config/connectDB.js'
import cors from 'cors'
import cartRoutes from './routes/cartRoutes.js'
import authRoutes from './routes/authRoutes.js'
import wishlistRoute from './routes/wishlistRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import adminRoutes from './routes/adminRoutes.js'


const app = express()
dotenv.config()

app.use(
  cors({
    origin: "https://readify-next.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "DELETE","PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json())
app.use(express.urlencoded({ extended: true }))



app.use('/uploads', express.static('uploads'));

connectDB()

app.use('/api/books', bookRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/user', authRoutes)
app.use('/api/wishlist', wishlistRoute)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)

app.use((error, req, res, next) => {
    res.status(error.code || 500).json({
        message: error.message || "An unknown error occurred",
    });
});

app.listen(process.env.PORT, () => {
    console.log("server running on  port 8000")
})