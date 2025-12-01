import HttpError from "../helpers/httpError.js";

export const adminCheck = (req, res, next) => {
  if (req.userData.role !== "admin") {
    return next(new HttpError("Access denied: Admin only", 403));
  }
  next();
};
