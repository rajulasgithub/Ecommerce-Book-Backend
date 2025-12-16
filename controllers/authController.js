import { User } from "../models/user.js";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import HttpError from "../helpers/httpError.js";
import { validationResult } from "express-validator";
import { Order } from "../models/order.js";
import { Book } from "../models/book.js";
import emailTemplates from "../config/mail/emailTemplate.js";
import { sendWelcomeEmail } from "../config/mail/nodemailer.js";


// user register
export const userRegister = async (req, res, next) => {
  try {
    console.log("body is", req.body);
    const errors = validationResult(req);
    console.log(errors);

    if (!errors.isEmpty()) {
      return next(new HttpError("Invalid data inputs passed", 400));
    } else {
      const { firstName, lastName, countryCode, phone, email, password, role } =
        req.body;

      const fullPhone = `${countryCode}${phone}`;

      const existingUser = await User.findOne({
        $or: [{ email }, { fullPhone }],
      });

      if (existingUser) {
        if (existingUser.email === email) {
          return next(new HttpError("Email already exists", 400));
        } else if (existingUser.fullPhone === fullPhone) {
          return next(new HttpError("Phone number already exists", 400));
        }
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
          firstName,
          lastName,
          fullPhone,
          email,
          password: hashedPassword,
          role,
        });

        await newUser.save();

        const welcomeLink = "https://tailwindcss.com/";
        const subject = 'Successfully  registered ';
        const template = emailTemplates.welcome_mail
        const user_name = newUser.firstName
        const to = newUser.email
        const context = {
          received_by: user_name,
          check: welcomeLink
        }

        await sendWelcomeEmail(to, subject, template, context)

        const token = jwt.sign(
          {
            user_id: newUser._id,
            role: newUser.role,
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_TOKEN_EXPIRY }
        );

        return res.status(201).json({
          success: true,
          message: "User registered successfully",
          data: {
            email: newUser.email,
            role: newUser.role,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            phone: newUser.fullPhone,
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
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.error("error:", errors);
      return next(new HttpError("Invalid data inputs passed", 400));
    }
    else {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select(
        "_id firstName lastName email fullPhone role password blocked"
      );

      if (!user) {
        return next(new HttpError("User not found", 404));
      }

      if (user.blocked) {
        return next(new HttpError("Your account has been blocked. Please contact support.", 403));
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return next(new HttpError("Incorrect password", 400));
      }
      else {
        const token = jwt.sign(
          {
            user_id: user._id,
            role: user.role,
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_TOKEN_EXPIRY }
        );

        return res.status(200).json({
          status: true,
          message: "Login successful",
          data: {
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.fullPhone,
          },
          accessToken: token,
        });

      }

    }

  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};





export const updateUserProfile = async (req, res, next) => {
  try {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array(),
      });
    }
    else {

      const userId = req.userData.userId

      const { firstName, lastName, email, phone, bio } = req.body;

      const updateFields = {};

      if (firstName) updateFields.firstName = firstName;
      if (lastName) updateFields.lastName = lastName;
      if (email) updateFields.email = email;
      if (phone) updateFields.phone = phone;
      if (bio) updateFields.bio = bio;


      if (req.file) {

        updateFields.image = req.file.path;
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true }
      );

      if (!updatedUser) {
        return next(new HttpError("User not found", 404));
      }
      else {
        return res.status(200).json({
          status: true,
          message: "Profile updated successfully",
          data: updatedUser,
        });
      }
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};



export const getProfile = async (req, res, next) => {
  try {
    const { userId, userRole } = req.userData
    if (userRole !== "customer" && userRole !== "seller") {
      return next(new HttpError("only customers and seller can edit their profile", 403));
    }
    else {
      const user = await User.findById(userId).select("-password");

      if (!user) {
        return next(new HttpError("user not found", 400));
      }
      else {
        return res.status(200).json({
          status: true,
          message: "User details fetched successfully",
          data: user,
        });
      }
    }
  } catch (error) {
    console.error("Get Me Error:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong while fetching user details",
    });
  }
};



export const getSellerStats = async (req, res, next) => {
  try {
    const { userRole, userId } = req.userData;

    if (userRole !== "seller") {
      return next(new HttpError("Only sellers can get stats", 403));
    }

    // Count of non-deleted books
    const totalBooks = await Book.countDocuments({ user: userId, is_deleted: false });

    // Fetch all seller books (including deleted) to get total orders
    const sellerBooks = await Book.find({ user: userId }, { _id: 1 });
    const sellerBookIds = sellerBooks.map((b) => b._id);

    // Get all orders that contain any seller book and payment is done
    const orders = await Order.find({
      "items.book": { $in: sellerBookIds },
      paymentStatus: "paid",
    }).lean();

    const totalOrders = orders.length;

    // Calculate total revenue only from non-cancelled items
    let totalRevenue = 0;
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (
          sellerBookIds.some((id) => String(id) === String(item.book)) &&
          item.status !== "cancelled"
        ) {
          totalRevenue += item.price * item.quantity;
        }
      });
    });

    return res.status(200).json({
      success: true,
      data: {
        totalBooks,
        totalOrders,
        totalRevenue,
      },
    });
  } catch (err) {
    console.error(err);
    return next(new HttpError("Failed to fetch seller stats", 500));
  }
};


export const getHomeBooks = async (req, res, next) => {
  try {

    const newBooks = await Book.find({ is_deleted: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title image author prize genre avgRating createdAt")
      .lean();

    const newBooksWithTag = newBooks.map((book) => ({
      ...book,
      tag: "new"
    }));

    const bestSellerAggregation = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { "items.status": { $ne: "cancelled" } } },

      {
        $group: {
          _id: "$items.book",
          totalSold: { $sum: "$items.quantity" },
        },
      },

      { $sort: { totalSold: -1 } },
      { $limit: 10 },

      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "book",
        },
      },

      { $unwind: "$book" },

      {
        $project: {
          _id: "$book._id",
          title: "$book.title",
          image: "$book.image",
          author: "$book.author",
          prize: "$book.prize",
          genre: "$book.genre",
          avgRating: "$book.avgRating",
          totalSold: 1,
        },
      },
    ]);

    const bestSellerBooks = bestSellerAggregation.map((item) => ({
      ...item,
      tag: "best-seller",
    }));

    return res.status(200).json({
      success: true,
      newBooks: newBooksWithTag,
      bestSellers: bestSellerBooks,
    });
  } catch (err) {
    console.error(err);
    return next(new HttpError("Failed to fetch home books", 500));
  }
};