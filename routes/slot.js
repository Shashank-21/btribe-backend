import express from "express";

const router = express.Router();

import {
  requireSignIn,
  isApprovedMentor,
  isApprovedAdmin,
} from "../middlewares/auth.js";

import {
  createSlot,
  listAllSlots,
  listSlotsByMentor,
  listSlotsByStudent,
  deleteSlot,
  bookSlot,
  updateSlotStatus,
  joinSlotWaitlist,
  updatePastSlotsStudent,
  updatePastSlotsMentor,
  deleteAllSlots,
  cancelSlotBookingStudent,
  handleFeedback,
  handleFeedbackApproval,
  handleRefundRequest,
  handleRefundRequestApproval,
  dropOffWaitList,
} from "../controllers/slot.js";

router.post("/slot", requireSignIn, isApprovedMentor, createSlot);
router.get("/slots", requireSignIn, listAllSlots);
router.get("/slots/:mentorId", requireSignIn, listSlotsByMentor);
router.get("/slots/:studentId", requireSignIn, listSlotsByStudent);
router.put("/slot/:slotId", requireSignIn, bookSlot);
router.put("/slot-waitlist/:slotId", requireSignIn, joinSlotWaitlist);
router.put(
  "/override-slot-status/:slotId",
  requireSignIn,
  isApprovedAdmin,
  updateSlotStatus
); // To be replaced by overrideSlotStatus
router.put("/update-slot-status/:slotId", requireSignIn, updateSlotStatus); // To be replaced by updateSlotStatus
router.put(
  "/cancel-slot-mentor/:slotId",
  requireSignIn,
  isApprovedMentor,
  deleteSlot
);

router.put("/update-student-slots", requireSignIn, updatePastSlotsStudent);
router.put(
  "/update-mentor-slots",
  requireSignIn,
  isApprovedMentor,
  updatePastSlotsMentor
);

router.delete(
  "/all-slots-admin",
  requireSignIn,
  isApprovedAdmin,
  deleteAllSlots
);

router.put("/cancel-slot-student", requireSignIn, cancelSlotBookingStudent);

router.put("/slot-feedback/:slotId", requireSignIn, handleFeedback);
router.put(
  "/slot-feedback-approval/:slotId",
  requireSignIn,
  isApprovedAdmin,
  handleFeedbackApproval
);

router.put("/request-slot-refund/:slotId", requireSignIn, handleRefundRequest);
router.put(
  "/request-slot-refund-approval/:slotId",
  requireSignIn,
  isApprovedAdmin,
  handleRefundRequestApproval
);

router.put("/drop-off-waitlist/:slotId", requireSignIn, dropOffWaitList);

export default router;
