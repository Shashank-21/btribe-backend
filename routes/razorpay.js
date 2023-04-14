import express from "express";
import { checkout, verifySignature } from "../controllers/razorpay.js";

const router = express.Router();

router.post("/create-order", checkout);
router.post("/verify-signature", verifySignature);

export default router;
