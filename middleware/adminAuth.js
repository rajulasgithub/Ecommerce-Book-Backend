// adminAuth.js
import HttpError from "../helpers/httpError.js";

export const adminCheck = (req, res, next) => {
  const { userRole } = req.userData;
  console.log(userRole)

  if (userRole !== "admin") {
    return next(new HttpError("Access Denied: Admin Only", 403));
  }

  next();
};
