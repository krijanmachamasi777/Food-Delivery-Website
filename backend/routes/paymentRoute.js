import express from "express";
import {
  getEsewaPaymentHash,
  verifyEsewaPayment,
} from "../controllers/esewa.js";
import Item from "../models/itemModel.js";
import PurchasedItem from "../models/purchaseItemModel.js";
import Payment from "../models/paymentModel.js";
import authMiddleware from "../middleware/auth.js";
import Order from "../models/orderModel.js";
import userModel from "../models/userModel.js";

const paymentRouter = express.Router();

// ----------------------------
// Initialize eSewa Payment
// ----------------------------
paymentRouter.post("/initialize-esewa", authMiddleware, async (req, res) => {
  try {
    const { items, address } = req.body; // include address

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No items provided" });
    }

    if (!address) {
      return res
        .status(400)
        .json({ success: false, message: "Address is required" });
    }

    let subtotal = 0;
    for (const i of items) {
      const dbItem = await Item.findById(i._id);
      if (!dbItem)
        return res
          .status(400)
          .json({ success: false, message: "Item not found" });
      const quantity = Number(i.quantity);
      if (!quantity || quantity <= 0)
        return res
          .status(400)
          .json({ success: false, message: "Invalid quantity" });
      subtotal += dbItem.price * quantity;
    }

    const deliveryFee = 50;
    const totalPrice = Number((subtotal + deliveryFee).toFixed(2));

    const purchasedItemData = await PurchasedItem.create({
  user: req.userId,
  items: items.map(i => ({
    item: i._id,
    quantity: i.quantity,
  })),
  totalPrice,
  paymentMethod: "esewa",
  status: "pending",
  paymentStatus: "unpaid",
  address: req.body.address, // ← ADD THIS
});


    const paymentInitiate = await getEsewaPaymentHash({
      amount: totalPrice,
      transaction_uuid: purchasedItemData._id,
    });

    res.json({ success: true, payment: paymentInitiate });
  } catch (error) {
    console.error("INIT ESEWA ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------
// Get User Orders
// ----------------------------
paymentRouter.get("/userorders", authMiddleware, async (req, res) => {
  try {
    const orders = await PurchasedItem.find({ user: req.userId }).populate(
      "items.item"
    );
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("USER ORDERS ERROR:", error);
    res
      .status(500)
      .json({ success: false, message: error.message, stack: error.stack });
  }
});

// ----------------------------
// Complete Payment Callback
paymentRouter.get("/complete-payment", async (req, res) => {
  const { data } = req.query;
  console.log("ESewa redirect data:", data);
const url = process.env.FRONTEND_URL ;
  try {
    const paymentInfo = await verifyEsewaPayment(data);
    console.log("Verified payment:", paymentInfo);

    // Fetch PurchasedItem from DB
    const purchasedItemData = await PurchasedItem.findById(
      paymentInfo.response.transaction_uuid
    );

    if (!purchasedItemData) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase not found" });
    }

    // 1️⃣ Create payment record
    const paymentData = await Payment.create({
      pidx: paymentInfo.decodedData.transaction_code,
      transactionId: paymentInfo.decodedData.transaction_code,
      productId: purchasedItemData._id,
      amount: purchasedItemData.totalPrice,
      dataFromVerificationReq: paymentInfo,
      apiQueryFromUser: req.query,
      paymentGateway: "esewa",
      status: "success",
    });

    // 2️⃣ Update PurchasedItem status
    await PurchasedItem.findByIdAndUpdate(purchasedItemData._id, {
      status: "completed",
      paymentStatus: "paid",
      paymentId: paymentData._id,
    });

    // 3️⃣ Create Order if it doesn’t exist
    const exists = await Order.findOne({
      purchasedItemId: purchasedItemData._id,
    });

    if (!exists) {
      const itemsWithName = await Promise.all(
        purchasedItemData.items.map(async (i) => {
          const dbItem = await Item.findById(i.item);
          return {
            item: i.item,
            quantity: i.quantity,
            name: dbItem.name,
          };
        })
      );

      await Order.create({
  userId: purchasedItemData.user.toString(),
  items: itemsWithName,
  amount: purchasedItemData.totalPrice,
  address: purchasedItemData.address, // ← make sure this exists
  payment: true, // ← must match the enum
  status: "Food Processing",
  purchasedItemId: purchasedItemData._id
});

    }

    // ✅ Clear user's cart after successful order creation
    await userModel.findByIdAndUpdate(purchasedItemData.user, { cartData: {} });

    // 3️⃣ Redirect to frontend
    res.redirect(`${url}/myorders`);
  } catch (error) {
    console.error("COMPLETE PAYMENT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
      stack: error.stack,
    });
  }
});

export default paymentRouter;