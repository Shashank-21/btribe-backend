import express from "express";

const router = express.Router();

import { requireSignIn, isApprovedAdmin } from "../middlewares/auth.js";

import {
  createVariant,
  listVariantsByCourse,
  readVariant,
  updateVariant,
  deleteVariant,
} from "../controllers/variant.js";

router.post("/variant/:courseId", createVariant);
router.get("/variants/:courseId", listVariantsByCourse);
router.get("/variant/:variantSlug", readVariant);
router.put(
  "/variant/:variantId",
  requireSignIn,
  isApprovedAdmin,
  updateVariant
);
router.delete(
  "/variant/:variantId",
  requireSignIn,
  isApprovedAdmin,
  deleteVariant
);

export default router;
