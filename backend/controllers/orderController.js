import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/// placing user order for frontend
const placeOrder = async (req, res) => {
// const frontend_url = process.env.FRONTEND_URL;
const frontend_url="http://localhost:5173"

  try {
    // Use the userId from auth middleware
    const userId = req.userId;

    const newOrder = new orderModel({
      userId, // ✅ use req.userId
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
    });

    await newOrder.save();

    // Clear user's cart
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    // Prepare Stripe line items
    const line_items = req.body.items.map((item) => ({
      price_data: {
        currency: "usd", // change to "inr" if needed
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100), // convert to cents
      },
      quantity: item.quantity,
    }));

    // Add delivery fee
    line_items.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Delivery Charges" },
        unit_amount: 2 * 100, // $2 delivery fee
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.error("PLACE ORDER ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyOrder = async (req, res) => {
  console.log("Request Body:", req.body); // see if orderId and success exist
  const { orderId, success } = req.body;

  if (!orderId) return res.status(400).json({ success: false, message: "OrderId missing" });

  try {
    if (success === "true") {
      const updatedOrder = await orderModel.findByIdAndUpdate(orderId, { payment: true }, { new: true });
      console.log("Updated Order:", updatedOrder);
      res.json({ success: true, message: "Paid" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    console.error("VERIFY ORDER ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


/// user orders for frontend
const userOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const orders = await orderModel.find({ userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("USER ORDERS ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Listing orders for admin panel
const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("LIST ORDERS ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/// api for updating order status
const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };
