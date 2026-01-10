import express from "express";
import authMiddleware from "../middleware/auth.js";
import Order from "../models/orderModel.js";

const orderRouter = express.Router();

/* ----------------------------
   Get logged-in user's orders
-----------------------------*/
orderRouter.get("/myorders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId.toString() })
      .populate("items.item");

    res.status(200).json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ----------------------------
   Get all orders (Admin / Dashboard)
-----------------------------*/
orderRouter.get("/all", async (req, res) => {
  try {
    const orders = await Order.find().populate("items.item");
    res.status(200).json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ----------------------------
   Update order status
-----------------------------*/
orderRouter.put("/status/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default orderRouter;
