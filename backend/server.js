import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import "dotenv/config";
import userRouter from "./routes/userRoutes.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";

/// app config

const app = express();
const port = 4000;

//// middlewares
app.use(express.json());
app.use(cors());

//// DB config
connectDB();

//// api endpoints
app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
// Serve images folder
app.use("/images", express.static("uploads"));

import cors from "cors";

app.use(
    cors({
    origin: [
      "https://food-delivery-website-git-main-krijanmachamasi777s-projects.vercel.app",
      "https://food-delivery-website-a-git-5b144a-krijanmachamasi777s-projects.vercel.app",
    ],
    credentials: true,
  })
);



app.get("/", (req, res) => {
  res.send("API WORKING");
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});

//    mongodb+srv://krijanmachamasi:33858627@cluster0.xooghey.mongodb.net/?
