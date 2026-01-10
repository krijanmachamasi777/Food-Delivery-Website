import mongoose from "mongoose";

const purchasedItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Item",
          required: true,
        },
        quantity: { type: Number, required: true, default: 1 },
      },
    ],

    totalPrice: { type: Number, required: true },

    // ✅ ADD THIS BLOCK
    address: {
      firstName: String,
      lastName: String,
      email: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String,
      phone: String,
    },

    purchaseDate: { type: Date, default: Date.now },

    paymentMethod: {
      type: String,
      enum: ["esewa", "khalti"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "refunded"],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
  },
  { timestamps: true }
);

const PurchasedItem =
  mongoose.models.PurchasedItem ||
  mongoose.model("PurchasedItem", purchasedItemSchema);

export default PurchasedItem;
