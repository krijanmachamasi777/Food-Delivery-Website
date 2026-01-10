import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose
    .connect(
      "mongodb+srv://krijanmachamasi:33858627@cluster0.xooghey.mongodb.net/Food_Delivery"
    )
    .then(() => console.log("MongoDB connected"));
    
};