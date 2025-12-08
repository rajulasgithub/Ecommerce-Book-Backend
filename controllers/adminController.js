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

    // Base filter (only customers & sellers)
    let searchQuery = {
      role: { $in: ["customer", "seller"] },
    };

    // Type filter
    if (type === "customer") searchQuery.role = "customer";
    else if (type === "seller") searchQuery.role = "seller";

    // Search filter
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

    // fetch users (paged) - exclude password
    const users = await User.find(searchQuery, "-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // If no users on this page, return early with empty data
    if (!users || users.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Users listed successfully",
        data: [],
        pagination: {
          total,
          page: currentPage,
          limit,
          totalPages,
        },
      });
    }

    // Build lists of IDs for aggregation
    const userIds = users.map((u) => (typeof u._id === "string" ? u._id : u._id.toString()));
    const sellerIds = users.filter((u) => u.role === "seller").map((u) => (typeof u._id === "string" ? u._id : u._id.toString()));

    // 1) Customer counts aggregation:
    //    We treat orders' `user` and `customer` fields as possible purchaser fields.
    //    The pipeline collects unique orders per user (so each order counts once).
    let customerCountsMap = {};
    if (userIds.length > 0) {
      const customerAgg = await Order.aggregate([
        // project an array of both possible purchaser fields
        {
          $project: {
            _id: 1,
            purchasers: ["$user", "$customer"],
          },
        },
        { $unwind: "$purchasers" },
        { $match: { purchasers: { $in: userIds.map(id => (id)) } } },
        { $group: { _id: "$purchasers", orders: { $addToSet: "$_id" } } },
        { $project: { _id: 1, count: { $size: "$orders" } } },
      ]);

      // convert to map for quick lookup
      customerAgg.forEach((r) => {
        customerCountsMap[String(r._id)] = r.count;
      });
    }

    // 2) Seller counts aggregation:
    //    Count distinct orders that include at least one item whose book.seller is the seller id.
    let sellerCountsMap = {};
    if (sellerIds.length > 0) {
      const sellerAgg = await Order.aggregate([
        { $match: { "items.book.seller": { $in: sellerIds.map(id => (id)) } } },
        { $unwind: "$items" },
        { $match: { "items.book.seller": { $in: sellerIds.map(id => (id)) } } },
        { $group: { _id: "$items.book.seller", orders: { $addToSet: "$_id" } } },
        { $project: { _id: 1, count: { $size: "$orders" } } },
      ]);

      sellerAgg.forEach((r) => {
        sellerCountsMap[String(r._id)] = r.count;
      });
    }

    // Attach counts to users (defaults to 0)
    const enriched = users.map((u) => {
      const idStr = typeof u._id === "string" ? u._id : String(u._id);
      return {
        ...u,
        customerOrderCount: customerCountsMap[idStr] ? customerCountsMap[idStr] : 0,
        sellerOrderCount: sellerCountsMap[idStr] ? sellerCountsMap[idStr] : 0,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Users listed successfully",
      data: enriched,
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




