import React, { useContext, useEffect, useState } from 'react'
import "./MyOrders.css"
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';
import axios from 'axios';


const MyOrders = () => {

  const { url } = useContext(StoreContext);
  const [data, setData] = useState([]);

  // Read token from context first, fallback to localStorage
  const token = localStorage.getItem("token");

  const fetchOrders = async () => {
    try {
      const response = await axios.get(
        url + "/api/order/myorders",
        { headers: { token } }
      );

      setData(response.data.orders);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchOrders();
  }, []);




  return (
    <div className='my-orders'>
      <h2>My Orders</h2>
      <div className="container">
        {data.map((order, index) => {
          return (
            <div className="my-orders-order" key={order._id || index}>
              <img src={assets.parcel_icon} alt="" />
              <p>
                {order.items.map((item, index) =>
                  index === order.items.length - 1
                    ? `${item.name} x ${item.quantity}`
                    : `${item.name} x ${item.quantity}, `
                )}
              </p>
              <p>RS {order.amount}.00</p>
              <p>Items:{order.items.length}</p>
              <p><span>&#x25cf;</span><b>{order.status}</b> </p>
              <button onClick={fetchOrders}>Track Order</button>
            </div>
          )
        })}
      </div>

    </div>
  )
}

export default MyOrders
