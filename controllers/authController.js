import { User } from "../models/user.js";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import HttpError from "../helpers/httpError.js";

// user register
export const userRegister = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password || !role) {
      return next(new HttpError("All fields are required", 400));
    }
    else {
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
            userId: newUser._id,
            userRole: newUser.role
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_TOKEN_EXPIRY }
        );

        return res.status(201).json({
          message: "User registered successfully",
          data: {
            id: newUser._id,
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
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new HttpError("Email and password are required", 400));
    } else {

      const user = await User.findOne({ email }).select("_id name email phone role password");

      if (!user) {
        return next(new HttpError("Invalid email", 400));
      } else {

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return next(new HttpError("Incorrect password", 400));
        } else {

          const token = jwt.sign(
            {
              userId: user._id,
              userRole: user.role
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

