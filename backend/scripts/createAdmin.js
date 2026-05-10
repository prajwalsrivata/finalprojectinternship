import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

mongoose.connect("mongodb://127.0.0.1:27017/foodDB");

const createAdmin = async () => {
  const hashedPassword = await bcrypt.hash("12345", 10);

  await Admin.create({
    username: "admin",
    password: hashedPassword,
  });

  console.log("Admin created ✅");
  process.exit();
};

createAdmin();