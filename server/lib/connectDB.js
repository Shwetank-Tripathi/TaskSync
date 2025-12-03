import mongoose from "mongoose";

const connectDB = async (URL) => {
  try {
    await mongoose.connect(URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default connectDB;
