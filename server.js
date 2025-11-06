import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import bookRoutes from './routes/bookRoutes.js'
import { connectDB } from './config/connectDB.js'

const app = express()
dotenv.config()

app.use(express.json())
app.use(express.urlencoded({extended:true}))

connectDB()

app.use((err, req, res, next) => {

    console.error(err)
    res.status(500).json({
        error: "something went wrong",
        errorMessage: err.message
    })
})
app.use('/api/books',bookRoutes)


app.listen(process.env.PORT,()=>{
    console.log("server running on  port 8000")
})