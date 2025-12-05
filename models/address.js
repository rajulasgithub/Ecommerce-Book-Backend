import mongoose from "mongoose";
const userAddressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  addresses: [
    {
      fullName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pinCode: String,
    }
  ]
});


export const Address = mongoose.model("Address", userAddressSchema);