import sendBlockStatusEmail from "../config/mail/sendBlockStatusEmail.js";
import sendDeleteUserEmail from "../config/mail/sendDeleteUserEmail.js";
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

    // Base query
    let searchQuery = {
      role: { $in: ["customer", "seller"] },
    };

    // Filter by type
    if (type === "customer") {
      searchQuery.role = "customer";
    } else if (type === "seller") {
      searchQuery.role = "seller";
    }

    // Add search filter if search string exists
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

    // fetch basic user data (exclude password)
    const users = await User.find(searchQuery, "-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // enrich each user with orders / order counts
    // do in parallel for performance
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const out = { ...u };

        // if customer: fetch all orders for this user (check both 'user' and 'customer' fields)
        if (u.role === "customer") {
          // find orders where order.user == user._id OR order.customer == user._id
          // select only fields we want to return (reduce payload)
          const orders = await Order.find(
            {
              $or: [{ user: u._id }, { customer: u._id }],
            },
            // project fields - adjust as per your Order schema
            "_id createdAt paymentStatus paymentMethod totalAmount items"
          )
            .sort({ createdAt: -1 })
            .lean();

          out.orders = orders;
          out.ordersCount = orders.length;
        }

        // if seller: count orders that include items for this seller
        if (u.role === "seller") {
          // This assumes your order items include a book reference with seller field:
          // order.items.book.seller === sellerId
          // Adjust the path if your schema stores seller elsewhere.
          const sellerOrderCount = await Order.countDocuments({
            "items.book.seller": u._id,
          });

          out.sellerOrderCount = sellerOrderCount;
        }

        // return enriched user object
        return out;
      })
    );

    return res.status(200).json({
      success: true,
      message: "Users listed successfully",
      data: enrichedUsers,
      pagination: {
        total,
        page: currentPage,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    return next(new HttpError(error.message || "Server Error", 500));
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

    try {
      await sendDeleteUserEmail(user.email, user.firstName);
    } catch (err) {
      console.error("Failed to send delete email:", err);
    }

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
    try {
      await sendBlockStatusEmail(user.email, user.firstName, user.blocked);
      console.log("Block/Unblock email sent successfully!");
    } catch (err) {
      console.error("Failed to send block/unblock email:", err);
    }

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




