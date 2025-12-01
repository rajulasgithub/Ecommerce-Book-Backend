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

  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};
