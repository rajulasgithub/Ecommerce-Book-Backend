import emailTemplates from "../config/mail/emailTemplate.js";
import { sendBlockUnblockEmail, sendDeletUserEmail } from "../config/mail/nodemailer.js";

import { Book } from "../models/book.js";
import { Order } from "../models/order.js";
import { User } from "../models/user.js";


export const listUsers = async (req, res, next) => {
  try {
    const { userRole } = req.userData;

    if (userRole !== "admin") {
      return next(new HttpError("Access Denied: Admin Only", 403));
    }

    let { page = 1, limit = 10, search = "", type = "" } = req.query;

    page = Number(page);
    limit = Number(limit);

   
    let searchQuery = {
      role: { $in: ["customer", "seller"] },
    };

   
    if (type === "customer") {
      searchQuery.role = "customer";
    } else if (type === "seller") {
      searchQuery.role = "seller";
    }

   
    if (search) {
      searchQuery.$or = [
        { firstName: { $regex: search, $options: "i" } }, 
        { lastName: { $regex: search, $options: "i" } },  
        { email: { $regex: search, $options: "i" } },     
      ];
    }

    const total = await User.countDocuments(searchQuery);
    const totalPages = Math.ceil(total / limit);

    const currentPage = page > totalPages && totalPages > 0 ? totalPages : page;
    const skip = (currentPage - 1) * limit;

    const users = await User.find(searchQuery, "-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: "Users listed successfully",
      data: users,
      pagination: {
        total,
        page: currentPage,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};





export const deleteUser = async (req, res, next) => {
  try {
    const { userRole } = req.userData;
    const { id } = req.params;

    if (userRole !== "admin") {
      return next(new HttpError("Access Denied: Admin Only", 403));
    }

    const user = await User.findById(id);

    if (!user) {
      return next(new HttpError("User not found", 404));
    }
         const subject = 'Successfully  deleted user ';
              const template = emailTemplates.delete_user_mail
              const user_name = user.firstName
              const to = user.email
              const context = {
                received_by: user_name,
                 
              }  
  
   
      await sendDeletUserEmail(to,subject,template,context);
   

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `${user.role} deleted successfully`,
    });

  } catch (err) {
    return next(new HttpError(err.message, 500));
  }
};


export const blockUnblockUser = async (req, res, next) => {
  try {
    const { userRole } = req.userData;
    const { id } = req.params;

    if (userRole !== "admin") {
      return next(new HttpError("Access Denied: Admin Only", 403));
    }

    const user = await User.findById(id);

    if (!user) {
      return next(new HttpError("User not found", 404));
    }

    // Toggle status
    user.blocked = !user.blocked;
    await user.save();

    // Send email notification
         const subject = user.blocked 
  ? "Your account has been blocked"
  : "Your account has been unblocked";
              const template = emailTemplates.status_update_mail
              const user_name = user.firstName
              const to = user.email
              const context = {
  received_by: user_name,
  status: user.blocked ? "blocked" : "unblocked",
};
  
      await sendBlockUnblockEmail(to,subject,template,context,user.blocked);
    
    return res.status(200).json({
      success: true,
      message: `${user.role} has been ${
        user.blocked ? "blocked" : "unblocked"
      } successfully`,
    });

  } catch (err) {
    return next(new HttpError(err.message, 500));
  }
};



export const getUserDetails = async (req, res, next) => {
  try {
    const { userRole } = req.userData;
    const { id } = req.params;

    if (userRole !== "admin") {
      return next(new HttpError("Access Denied: Admin Only", 403));
    }
    else{
         const user = await User.findById(id, "-password");
    if (!user) {
      return next(new HttpError("User not found", 404));
    }
    const orders = await Order.find({ user: id })
      .populate({
        path: "items.book",
        select: "title author category price", 
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      data: {
        user,
        orders
      },
    });

    }

   

  } catch (err) {
    return next(new HttpError(err.message, 500));
  }
};





export const getDashboardStats = async (req, res, next) => {
  try {
    const { userRole } = req.userData;

    if (userRole !== "admin") {
      return next(new HttpError("Access Denied: Admin Only", 403));
    }
    else{ const customersCount = await User.countDocuments({ role: "customer" });

 
    const sellersCount = await User.countDocuments({ role: "seller" });


    const booksCount = await Book.countDocuments();


    const ordersCount = await Order.countDocuments();

    return res.status(200).json({
      success: true,
      message: "Dashboard stats fetched successfully",
      data: {
        customersCount,
        sellersCount,
        booksCount,
        ordersCount,
      },
    });

    }
  } catch (err) {
    return next(new HttpError(err.message, 500));
  }
};



export const getBooksBySeller = async (req, res, next) => {
  try {
    const { userRole } = req.userData;
    const { id } = req.params;
    const page = parseInt(req.query.page ) || 1;
    const limit = parseInt(req.query.limit ) || 10;
    const skip = (page - 1) * limit;

    if (userRole !== "admin") {
      return next(new HttpError("Access Denied: Admin Only", 403));
    }

    const seller = await User.findById(id);
    if (!seller || seller.role !== "seller") {
      return next(new HttpError("Seller not found", 404));
    }

    const totalBooks = await Book.countDocuments({ user: id, is_deleted: false });
    const books = await Book.find({ user: id, is_deleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: books,
      pagination: {
        totalBooks,
        page,
        limit,
        totalPages: Math.ceil(totalBooks / limit),
      },
    });
  } catch (err) {
    return next(new HttpError(err.message, 500));
  }
};




