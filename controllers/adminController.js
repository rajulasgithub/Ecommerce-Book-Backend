import { Book } from "../models/book.js";
import { Order } from "../models/order.js";
import { User } from "../models/user.js";


export const listUsers = async (req, res, next) => {
  try {
    const { userRole } = req.userData;

    if (userRole !== "admin") {
      return next(new HttpError("Access Denied: Admin Only", 403));
    }
    else{
         let { page = 1, limit = 10, search = "", type = "" } = req.query;

    page = Number(page);
    limit = Number(limit);


    let searchQuery = {
      role: { $in: ["customer", "seller"] }
    };

  
    if (type === "customer") {
      searchQuery.role = "customer";
    } else if (type === "seller") {
      searchQuery.role = "seller";
    }

    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(searchQuery);
    const totalPages = Math.ceil(total / limit);

    const currentPage =
      page > totalPages && totalPages > 0 ? totalPages : page;

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

    }

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
    else{
         const user = await User.findById(id);

    if (!user) {
      return next(new HttpError("User not found", 404));
    }
    else{
         await User.findByIdAndDelete(id);

        return res.status(200).json({
        success: true,
        message: `${user.role} deleted successfully`,
        });
        
    }
    }
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
    else{
      
    const user = await User.findById(id);

    if (!user) {
      return next(new HttpError("User not found", 404));
    }
    else{
        user.blocked = !user.blocked;
       await user.save();

    return res.status(200).json({
      success: true,
      message: `${user.role} has been ${user.blocked ? "blocked" : "unblocked"} successfully`,
     
    });
    }

    }
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
     console.log(req.params)
    
    if (userRole !== "admin") {
      return next(new HttpError("Access Denied: Admin Only", 403));
    }
    else{
      const seller = await User.findById(id);
    if (!seller || seller.role !== "seller") {
      return next(new HttpError("Seller not found", 404));
    }
    else{
   const books = await Book.find({ user: id, is_deleted: false }).sort({ });
      console.log(books)
        return res.status(200).json({
          success: true,
          data:books,
        });
    }
    }  
  } catch (err) {
    return next(new HttpError(err.message, 500));
  }
};