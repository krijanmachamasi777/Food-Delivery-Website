import axios from "axios";
import crypto from "crypto";

export async function getEsewaPaymentHash({ amount, transaction_uuid }) {
  const secretKey = process.env.ESEWA_SECRET_KEY;
  const productCode = process.env.ESEWA_PRODUCT_CODE;

  const amountStr = Number(amount).toFixed(2);

const payload = {
  amount: amountStr,
  tax_amount: "0",
  total_amount: amountStr,           // use amountStr, not total
  transaction_uuid: transaction_uuid.toString(),
  product_code: productCode,
  product_service_charge: "0",
  product_delivery_charge: "0",
  success_url: "http://localhost:4000/api/payment/complete-payment",
  failure_url: "http://localhost:4000/api/payment/failed-payment",
  signed_field_names: "total_amount,transaction_uuid,product_code",
};
if (!amount || isNaN(amount)) {
  throw new Error("Invalid amount passed to eSewa");
}


  const signatureBaseString =
    `total_amount=${payload.total_amount},` +
    `transaction_uuid=${payload.transaction_uuid},` +
    `product_code=${payload.product_code}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(signatureBaseString)
    .digest("base64");

  return {
    ...payload,
    signature,
  };
}

export async function verifyEsewaPayment(encodedData) {
  try {
    // ✅ Node-safe Base64 decode
    const decodedData = JSON.parse(
      Buffer.from(encodedData, "base64").toString("utf-8")
    );

    const data = `transaction_code=${decodedData.transaction_code},status=${decodedData.status},total_amount=${decodedData.total_amount},transaction_uuid=${decodedData.transaction_uuid},product_code=${process.env.ESEWA_PRODUCT_CODE},signed_field_names=${decodedData.signed_field_names}`;

    const secretKey = process.env.ESEWA_SECRET_KEY;

    const hash = crypto
      .createHmac("sha256", secretKey)
      .update(data)
      .digest("base64");

    if (hash !== decodedData.signature) {
      throw new Error("Invalid signature");
    }

    const response = await axios.get(
      `${process.env.ESEWA_GATEWAY_URL}/api/epay/transaction/status/`,
      {
        params: {
          product_code: process.env.ESEWA_PRODUCT_CODE,
          total_amount: decodedData.total_amount,
          transaction_uuid: decodedData.transaction_uuid,
        },
      }
    );

    if (
      response.data.status !== "COMPLETE" ||
      response.data.transaction_uuid !== decodedData.transaction_uuid ||
      Number(response.data.total_amount) !== Number(decodedData.total_amount)
    ) {
      throw new Error("Payment verification failed");
    }

    return { response: response.data, decodedData };
  } catch (error) {
    throw error;
  }
}
