import React, { useContext, useEffect } from "react";
import "./Verify.css";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";

const Verify = () => {
  const { url } = useContext(StoreContext);
  const navigate = useNavigate();

  useEffect(() => {
    const storedData = localStorage.getItem("paymentVerification");

    if (!storedData) {
      navigate("/");
      return;
    }

    const { success, orderId } = JSON.parse(storedData);

    if (!success || !orderId) {
      navigate("/");
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await axios.post(
          `${url}/api/order/verify`,
          { success, orderId }
        );

        // Clean up after verification
        localStorage.removeItem("paymentVerification");

        if (response.data.success) {
          navigate("/myorders");
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("VERIFY ERROR:", error);
        navigate("/");
      }
    };

    verifyPayment();
  }, [url, navigate]);

  return (
    <div className="verify">
      <div className="spinner"></div>
    </div>
  );
};

export default Verify;
