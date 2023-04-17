import express from "express";

const router = express.Router();

import { requireSignIn, isMentor, isAdmin } from "../middlewares/auth.js";

import {
  createSlot,
  listAllSlots,
  listSlotsByMentor,
  listSlotsByStudent,
  deleteSlot,
  bookSlot,
  joinSlotWaitlist,
} from "../controllers/slot.js";

router.post("/slot", requireSignIn, isMentor, createSlot);
router.get("/slots", requireSignIn, listAllSlots);
router.get("/slots/:mentorId", requireSignIn, listSlotsByMentor);
router.get("/slots/:studentId", requireSignIn, listSlotsByStudent);
router.put("/slot/:slotId", requireSignIn, bookSlot);
router.put("/slot-waitlist/:slotId", requireSignIn, joinSlotWaitlist);
router.delete("/slot/:slotId", requireSignIn, isMentor, deleteSlot);

export default router;
