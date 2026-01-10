import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "./Verify.css";

const Verify = () => {
  const [searchParams] = useSearchParams();
  const data = searchParams.get("data"); // eSewa sends ?data=BASE64
  const navigate = useNavigate();

  useEffect(() => {
    if (!data) {
      // No data → redirect home
      navigate("/");
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await axios.get(
          `https://food-delivery-website-3068.onrender.com/api/payment/complete-payment`,
          {
            params: { data },
          }
        );

        if (response.data.success !== false) {
          // Redirect to My Orders after verification
          navigate("/myorders");
        } else {
          console.error("Payment verification failed:", response.data);
          navigate("/");
        }
      } catch (error) {
        console.error("VERIFY ERROR:", error);
        navigate("/");
      }
    };

    verifyPayment();
  }, [data, navigate]);

  return (
    <div className="verify">
      <div className="spinner"></div>
      <p>Verifying your payment...</p>
    </div>
  );
};

export default Verify;
