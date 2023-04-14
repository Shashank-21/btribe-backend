import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

export const slotSchema = new mongoose.Schema(
  {
    mentor: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    student: {
      type: ObjectId,
      ref: "User",
      required: false,
    },
    waitList: [
      {
        type: ObjectId,
        ref: "User",
        required: false,
      },
    ],
    dateTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      default: "open",
    },
    purpose: {
      type: String,
      required: false,
    },
    purposeWaitList: [
      {
        type: String,
        required: false,
      },
    ],
    mentorCancellationReason: {
      type: String,
      required: false,
    },
    studentRefundReason: {
      type: String,
      required: false,
    },
    timeRef: {
      type: Number,
      required: false,
    },
    eventDetails: {
      type: Object,
      required: false,
    },
    feedbackMentor: {
      rating: {
        type: Number,
        required: false,
      },
      subjectiveFeedback: {
        type: String,
        required: false,
      },
      status: {
        type: String,
        required: false,
      },
    },
    feedbackStudent: {
      rating: {
        type: Number,
        required: false,
      },
      subjectiveFeedback: {
        type: String,
        required: false,
      },
      status: {
        type: String,
        required: false,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Slot", slotSchema);
