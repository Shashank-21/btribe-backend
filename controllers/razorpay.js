import Razorpay from "razorpay";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils.js";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY_ID,
  key_secret: process.env.RAZORPAY_API_KEY_SECRET,
});

export const checkout = async (request, response) => {
  try {
    const { amount } = request.body;

    const options = {
      amount: Number(amount) * 100, // amount in the smallest currency unit
      currency: "INR",
    };
    const order = await instance.orders.create(options);
    console.log(order);
    response.json(order);
  } catch (error) {
    response.status(400).json(error);
  }
};

export const verifySignature = async (request, response) => {
  try {
    const { razorpayResponse, email, name } = request.body;
    const data = validatePaymentVerification(
      {
        order_id: razorpayResponse.razorpay_order_id,
        payment_id: razorpayResponse.razorpay_payment_id,
      },
      razorpayResponse.razorpay_signature,
      process.env.RAZORPAY_API_KEY_SECRET
    );
    //Email with order id and payment id
    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Payment Received",
      html: `
      <p>Name: ${name}</p>
      <p>Order id: ${razorpayResponse.razorpay_order_id}</p>
      <p>Payment id: ${razorpayResponse.razorpay_payment_id}</p>
       `,
    };

    try {
      await sgMail.send(emailData);
    } catch (error) {
      console.log(error);
    }

    response.json(data);
  } catch (error) {
    console.log(error);
    response.status(400).json(error);
  }
};
