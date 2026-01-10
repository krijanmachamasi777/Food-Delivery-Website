import PurchasedItem from "../models/purchaseItemModel.js";

export const userOrders = async (req, res) => {
  try {
    // req.userId comes from authMiddleware
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

  const orders = await PurchasedItem.find({ user: req.userId }).populate("items.item");

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
