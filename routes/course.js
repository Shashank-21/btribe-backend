import express from "express";

const router = express.Router();

import { requireSignIn, isApprovedAdmin } from "../middlewares/auth.js";

import {
  createCourse,
  listCourse,
  readCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/course.js";

router.post("/course", requireSignIn, isApprovedAdmin, createCourse);
router.get("/courses", listCourse);
router.get("/course/:slug", readCourse);
router.put("/course/:courseId", requireSignIn, isApprovedAdmin, updateCourse);
router.delete(
  "/course/:courseId",
  requireSignIn,
  isApprovedAdmin,
  deleteCourse
);

export default router;
