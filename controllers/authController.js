import mongoose from "mongoose";
import { User } from "../models/user.js";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import HttpError from "../helpers/httpError.js";



export const userRegister = async (req, res,next) => {
  try {
    const { name, email, phone, password ,role } = req.body;
    console.log(req.body)

    if (!name || !email || !phone || !password || !role) {
     return next(new HttpError("All fileds are required", 400))
    }
 
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
    
     return next(new HttpError("Email already exists", 400))
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) { 
      return next(new HttpError("Phone number already exists", 400))
    } else {
    const hashedPassword = await bcrypt.hash(password,10)
      const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role
    });

    await newUser.save();

    const token = jwt.sign({
        userId: newUser._id,
        userRole:newUser.role
    },
   process.env.JWT_SECRET,
  {expiresIn:process.env.JWT_TOKEN_EXPIRY}
)

    return res.status(201).json({
      message: "User registered successfully",
       data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,  
      },
      accessToken:token

    });
  }
  } catch (error) {
    // return res.status(500).json({ message: "Server Error", error: error.message });
     return next(new HttpError(`error:${error.message}`, 500))
  }
};


export const userLogin = async (req, res,next) => {
  try {

    const { email, password } = req.body;
 
    if (!email || !password) {
      return next(new HttpError("Email and password are required", 400))
    }

    const user = await User.findOne({ email }).select("_id name email phone role password")

    if (!user) {
      return next(new HttpError("Invalid email", 400))
    }
   const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return next(new HttpError("Incorrect password", 400))
    }

    else{

          const token=jwt.sign(
                    {
                    userId:user._id,
                    userRole:user.role         
                    },
                    process.env.JWT_SECRET,
                    {expiresIn:process.env.JWT_TOKEN_EXPIRY}
                )

    return res.status(200).json({
        status: true,
        message: "Login successful",
        data: user,
        accessToken: token
    });
    }

  } catch (error) {

    // return res.status(500).json({
    //   message: "Server Error",e
    //   error: error.message,
    // });

    return next(new HttpError(`Server Error:${error.message}`, 500))
  }
};