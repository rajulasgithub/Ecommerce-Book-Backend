import { User } from "../models/user.js";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import HttpError from "../helpers/httpError.js";
import { validationResult } from "express-validator";

// user register
export const userRegister = async (req, res, next) => {
  try {
    const errors = validationResult(req)
     console.log(errors)
    if (!errors.isEmpty()) {
      return next(new HttpError("Invalid data inputs passed", 400));
    }
    else {

    const { name, email, phone, password, role } = req.body;

      const existingUser = await User.findOne({
        $or: [{ email }, { phone }]
      });

      if (existingUser) {
        if (existingUser.email === email) {
          return next(new HttpError("Email already exists", 400));
        }
        else if (existingUser.phone === phone) {
          return next(new HttpError("Phone number already exists", 400));
        }
      }
      else {
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
          name,
          email,
          phone,
          password: hashedPassword,
          role
        });

        await newUser.save();

        const token = jwt.sign(
          {
            user_id: newUser._id,
            role: newUser.role
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_TOKEN_EXPIRY }
        );

        return res.status(201).json({
          message: "User registered successfully",
          data: {
        
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone
          },
          accessToken: token
        });
      }
    }
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};

// user login
export const userLogin = async (req, res, next) => {
  try {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      console.error("error:",errors)
      return next(new HttpError("Invalid data inputs passed", 400));
    } else {

      const { email, password } = req.body;

      const user = await User.findOne({ email }).select("_id name email phone role password");

      if (!user) {
        return next(new HttpError("User not found", 404));
      } else {

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return next(new HttpError("Incorrect password", 400));
        } else {

          const token = jwt.sign(
            {
              user_id: user._id,
              role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_TOKEN_EXPIRY }
          );

          return res.status(200).json({
            status: true,
            message: "Login successful",
            data: {
              id: user._id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: user.role
            },
            accessToken: token
          });

        }
      }
    }

  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};



export const resetPasswordDirect = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return next(new HttpError("New password is required", 400));
    }


    const user = await User.findById(id);

    if (!user) {
      return next(new HttpError("User not found", 404));

    }


    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      message: "Password reset successfully",
      userId: user._id
    });
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};