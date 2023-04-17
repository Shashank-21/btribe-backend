import express from "express";

const router = express.Router();

import { requireSignIn, isAdmin } from "../middlewares/auth.js";

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
router.put("/variant/:variantId", requireSignIn, isAdmin, updateVariant);
router.delete("/variant/:variantId", requireSignIn, isAdmin, deleteVariant);

export default router;
