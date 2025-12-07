import jwt from "jsonwebtoken";
import HttpError from "../helpers/httpError.js";
import { User } from "../models/user.js";

const userAuthCheck = async (req, res, next) => {
  
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    
    const token = req.headers.authorization.split(" ")[1];
    if (! token) {
        return next(new HttpError("Authentication Failed", 403))
    } else {
     
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ _id: decodedToken.user_id })
  
      if (! user) {
        return next(new HttpError("Invalid credentials", 400))
      } else {
        req.userData = { userId : decodedToken.user_id, userRole : decodedToken.role }; 
        next();
      }
    }
  } catch (err) {
    return next(new HttpError("Authentication failed", 403));
  }
};

export default userAuthCheck;
