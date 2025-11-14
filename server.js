import express from 'express'
import dotenv from 'dotenv'
import bookRoutes from './routes/bookRoutes.js'
import { connectDB } from './config/connectDB.js'
import cors from 'cors'
import cartRoutes from './routes/cartRoutes.js'
import authRoutes from './routes/authRoutes.js'

const app = express()
dotenv.config()

app.use(express.json())
app.use(express.urlencoded({ extended:true}))
app.use(cors())

connectDB()

// app.use((err, req, res, next) => {

//     console.error(err)
//     res.status(500).json({
//         error: "something went wrong",
//         errorMessage: err.message
//     })
// })

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  res.status(error.code || 500).json({ message: error.message || "An unknown error occurred!" });
});

app.use('/api/books',bookRoutes)
app.use('/api/cart',cartRoutes)
app.use('/api/user',authRoutes)



app.listen(process.env.PORT,()=>{
    console.log("server running on  port 8000")
})