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
  },
  { timestamps: true }
);

export default mongoose.model("Slot", slotSchema);
