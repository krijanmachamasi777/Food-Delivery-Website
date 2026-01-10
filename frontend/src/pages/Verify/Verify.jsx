import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import './Verify.css'

export default function VerifyPayment() {
  const [searchParams] = useSearchParams();
  const data = searchParams.get("data");
  const navigate = useNavigate();

  useEffect(() => {
    if (!data) {
      navigate("/");
      return;
    }

    const verify = async () => {
      try {
        await axios.get(
          `https://food-delivery-website-3068.onrender.com/api/payment/complete-payment`,
          { params: { data } }
        );
        navigate("/myorders");
      } catch (error) {
        console.error("Payment verification failed:", error);
        navigate("/");
      }
    };

    verify();
  }, [data, navigate]);

  return <div>Verifying your payment...</div>;
}
