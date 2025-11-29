import { User } from "../models/user.js";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import HttpError from "../helpers/httpError.js";
import { validationResult } from "express-validator";
// import otpGenerator from 'otp-generator'
// import { OTP } from "../models/otp.js";
// import { sendOtpEmail } from "../config/sendOtp.js";



// user register
export const userRegister = async (req, res, next) => {
  try {
    console.log("body is",req.body)
    const errors = validationResult(req);
    console.log(errors);

    if (!errors.isEmpty()) {
      return next(new HttpError("Invalid data inputs passed", 400));
    }
    else {

      const { firstName, lastName, countryCode, phone, email, password, role } = req.body;
      
      const fullPhone = `${countryCode}${phone}`;

      const existingUser = await User.findOne({
        $or: [{ email }, { fullPhone }]
      });

      if (existingUser) {
        if (existingUser.email === email) {
          return next(new HttpError("Email already exists", 400));
        }
        else if (existingUser.fullPhone === fullPhone) {
          return next(new HttpError("Phone number already exists", 400));
        }
      }
      else {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
          firstName,
          lastName,
          fullPhone,
          email,
          password: hashedPassword,
          role
        });

        await newUser.save();

        const token = jwt.sign(
          {
            user_id: newUser._id,
            role: newUser.role
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_TOKEN_EXPIRY }
        );

        return res.status(201).json({
          success:true,
          message: "User registered successfully",
          data: {
            email: newUser.email,
            role: newUser.role
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
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      console.error("error:",errors)
      return next(new HttpError("Invalid data inputs passed", 400));
    } else {

      const { email, password } = req.body;

      const user = await User.findOne({ email }).select("_id name email phone role password");

      if (!user) {
        return next(new HttpError("User not found", 404));
      } else {

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return next(new HttpError("Incorrect password", 400));
        } else {

          const token = jwt.sign(
            {
              user_id: user._id,
              role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_TOKEN_EXPIRY }
          );

          return res.status(200).json({
            status: true,
            message: "Login successful",
            data: {
              email: user.email,
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



export const resetPasswordDirect = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return next(new HttpError("New password is required", 400));
    }


    const user = await User.findById(id);

    if (!user) {
      return next(new HttpError("User not found", 404));

    }


    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      message: "Password reset successfully",
      userId: user._id
    });
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};



export const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

   
    if (!name || !email || !password) {
      return next(new HttpError("Name, email and password are required", 400));
    }

   
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return next(new HttpError("Admin already exists with this email", 400));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin", 
    });

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};





// sendotp

// export const sendOtp =async (req, res,next) =>{
//   try{
//       const errors = validationResult(req)

//     if (!errors.isEmpty()) {
//       console.error("error:",errors)
//       return next(new HttpError("Invalid data inputs passed", 400));
//     }
//     else{
//          const { userRole } = req.userData;

//          if(userRole !=="customer" && userRole !=="seller" ){
//            return next(new HttpError("only customer and seller can reset", 400));
//          }
//          else{
//           const { email } = req.body;
//            if (!email) return res.status(400).json({ message: 'Email is required' });
//            else{
//          const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });

//         await OTP.deleteMany({ email });
//     const newOtp = new OTP({ email, otp });
//     await newOtp.save();

//     await sendOtpEmail(email, otp);

//     res.status(200).json({ success: true, message: 'OTP sent successfully' });

//          }
//     }

//            }

  
//   }
//   catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: 'Failed to send OTP' });
//   }

// }




// // verify

// export const verifyOtp = async (req, res) => {
//   try {
//     const errors = validationResult(req)

//     if (!errors.isEmpty()) {
//       console.error("error:",errors)
//       return next(new HttpError("Invalid data inputs passed", 400));
//     }
//     else{
//       const { userRole } = req.userData;

//          if(userRole !=="customer" && userRole !=="seller" ){
//            return next(new HttpError("only customer and seller can reset", 400));
//          }
//          else{
//           const { email, otp } = req.body;

//     if (!email || !otp) {
//       return res.status(400).json({ success: false, message: "Email and OTP are required" });
//     }
//     else{
//       const otpEntry = await OTP.findOne({ email, otp });

//     if (!otpEntry) {
//       return res.status(400).json({ success: false, message: "Invalid OTP" });
//     }

    
//     await OTP.deleteOne({ _id: otpEntry._id });

//     return res.status(200).json({ success: true, message: "OTP verified successfully" });
      
//     }


//          }
//     }
    
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };


// // reset password

// export const resetPassword = async (req, res, next) => {
//   try {
//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//       console.error("error:", errors);
//       return next(new HttpError("Invalid data inputs passed", 400));
//     }

//     const { userRole } = req.userData;

//     // Only customer and seller can reset password
//     if (userRole !== "customer" && userRole !== "seller") {
//       return next(new HttpError("Only customer and seller can reset password", 400));
//     }

//     const { email, otp, password } = req.body;
//     console.log(email, otp, password )

//     if (!email || !otp || !password) {
//       return res.status(400).json({ success: false, message: "Email, OTP and password are required" });
//     }

//     // Check if OTP exists (optionally you can skip if already verified)
//     const otpEntry = await OTP.findOne({ email, otp });
//     if (!otpEntry) {
//       return res.status(400).json({ success: false, message: "Invalid OTP" });
//     }

//     // Delete OTP after use
//     await OTP.deleteOne({ _id: otpEntry._id });

//     // Find user and update password
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     // Hash new password
//     const hashedPassword = await bcrypt.hash(password, 12);
//     user.password = hashedPassword;

//     await user.save();

//     return res.status(200).json({ success: true, message: "Password reset successfully" });

//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };

