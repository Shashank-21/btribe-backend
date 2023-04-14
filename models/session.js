import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

const sessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    variant: {
      type: ObjectId,
      ref: "Variant",
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    assignment: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);
