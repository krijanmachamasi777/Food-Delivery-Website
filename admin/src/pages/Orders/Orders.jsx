import React, { useState, useEffect } from "react";
import "./Orders.css";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);

  // Fetch all orders
  const fetchAllOrders = async () => {
    try {
      const response = await axios.get(url + "/api/order/all");
      if (response.data.success) {
        setOrders(response.data.orders);
      } else {
        toast.error("Error fetching orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error("Error fetching orders");
    }
  };

  // Update order status
 const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const response = await axios.put(`${url}/api/order/status/${orderId}`, {
      status: newStatus, // use the selected value from dropdown
    });

    if (response.data.success) {
      toast.success("Order status updated");
      fetchAllOrders(); // refresh list
    } else {
      toast.error("Failed to update status");
    }
  } catch (err) {
    console.error("Error updating status:", err);
    toast.error("Error updating status");
  }
};


  useEffect(() => {
    fetchAllOrders();
  }, []);

  return (
    <div className="order add">
      <h3>All Orders</h3>

      <div className="order-list">
        {orders.map((order) => (
          <div key={order._id} className="order-item">
            <img src={assets.parcel_icon} alt="" />

            <div>
              <p className="order-item-food">
                {order.items
                  .map((item) => `${item.name} x ${item.quantity}`)
                  .join(", ")}
              </p>

              <p className="order-item-name">
                {order.address?.firstName} {order.address?.lastName}
              </p>

              <div className="order-item-address">
                <p>{order.address?.street},</p>
                <p>
                  {order.address?.city}, {order.address?.state},{" "}
                  {order.address?.country}, {order.address?.zipcode}
                </p>
              </div>

              <p className="order-item-phone">{order.address?.phone}</p>
            </div>

            <p>Items: {order.items.length}</p>
            <p>${order.amount}</p>

            {/* Status Dropdown */}
            <select
              value={order.status}
              onChange={(e) =>
                updateOrderStatus(order._id, e.target.value)
              }
            >
              <option value="Food Processing">Food Processing</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
