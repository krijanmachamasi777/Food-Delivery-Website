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

/* ======================================================
   INITIALIZE ESEWA PAYMENT
====================================================== */
paymentRouter.post("/initialize-esewa", authMiddleware, async (req, res) => {
  try {
    console.log("REQUEST BODY:", req.body);
    const { items, address } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items provided" });
    }
    console.log("Items OK");

    if (!address) {
      return res.status(400).json({ success: false, message: "Address required" });
    }
    console.log("Address OK");

    let subtotal = 0;
    for (const i of items) {
      console.log("Processing item:", i);
      const dbItem = await Item.findById(i._id);
      console.log("DB Item:", dbItem);
      if (!dbItem)
        return res.status(400).json({ success: false, message: "Item not found" });

      const quantity = Number(i.quantity);
      if (!quantity || quantity <= 0)
        return res.status(400).json({ success: false, message: "Invalid quantity" });

      subtotal += dbItem.price * quantity;
    }
    console.log("Subtotal calculated:", subtotal);

    const deliveryFee = 50;
    const totalPrice = Number((subtotal + deliveryFee).toFixed(2));
    console.log("Total price:", totalPrice);

    const purchasedItemData = await PurchasedItem.create({
      user: req.userId,
      items: items.map(i => ({ item: i._id, quantity: i.quantity })),
      totalPrice,
      paymentMethod: "esewa",
      status: "pending",
      paymentStatus: "unpaid",
      address,
    });
    console.log("PurchasedItem created:", purchasedItemData);

    const paymentInitiate = getEsewaPaymentHash({
      amount: totalPrice,
      transaction_uuid: purchasedItemData._id.toString(),
    });
    console.log("Payment payload created");

    res.status(200).json({ success: true, payment: paymentInitiate });
  } catch (error) {
    console.error("INIT ESEWA ERROR:", error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
});


/* ======================================================
   GET USER ORDERS
====================================================== */
paymentRouter.get("/userorders", authMiddleware, async (req, res) => {
  try {
    const orders = await PurchasedItem.find({ user: req.userId }).populate(
      "items.item"
    );

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("USER ORDERS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ======================================================
   ESEWA SUCCESS CALLBACK
   (eSewa redirects with ?data=BASE64)
====================================================== */
paymentRouter.get("/complete-payment", async (req, res) => {
  const { data } = req.query;

  if (!data) {
    return res
      .status(400)
      .json({ success: false, message: "Missing payment data" });
  }

  try {
    const paymentInfo = await verifyEsewaPayment(data);

    const transactionUUID =
      paymentInfo.response.transaction_uuid ||
      paymentInfo.decodedData.transaction_uuid;

    // 1️⃣ Fetch PurchasedItem
    const purchasedItemData = await PurchasedItem.findById(transactionUUID);

    if (!purchasedItemData) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase not found" });
    }

    // 2️⃣ Prevent duplicate payment processing
    if (purchasedItemData.paymentStatus === "paid") {
      return res.redirect(
        "https://food-delivery-website-nwdwxz8ic-krijanmachamasi777s-projects.vercel.app/myorders"
      );
    }

    // 3️⃣ Create Payment record
    const paymentData = await Payment.create({
      pidx: paymentInfo.decodedData.transaction_code,
      transactionId: paymentInfo.decodedData.transaction_code,
      productId: purchasedItemData._id,
      amount: purchasedItemData.totalPrice,
      paymentGateway: "esewa",
      status: "success",
      dataFromVerificationReq: paymentInfo,
      apiQueryFromUser: req.query,
    });

    // 4️⃣ Update PurchasedItem
    await PurchasedItem.findByIdAndUpdate(purchasedItemData._id, {
      status: "completed",
      paymentStatus: "paid",
      paymentId: paymentData._id,
    });

    // 5️⃣ Create Order (if not exists)
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
            name: dbItem?.name || "",
          };
        })
      );

      await Order.create({
        userId: purchasedItemData.user.toString(),
        items: itemsWithName,
        amount: purchasedItemData.totalPrice,
        address: purchasedItemData.address,
        payment: true,
        status: "Food Processing",
        purchasedItemId: purchasedItemData._id,
      });
    }

    // 6️⃣ Clear cart
    await userModel.findByIdAndUpdate(purchasedItemData.user, {
      cartData: {},
    });

    // 7️⃣ Redirect user
    res.redirect(
      "https://food-delivery-website-nwdwxz8ic-krijanmachamasi777s-projects.vercel.app/myorders"
    );
  } catch (error) {
    console.error("COMPLETE PAYMENT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
});

export default paymentRouter;
