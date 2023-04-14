import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

export const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    course: {
      type: ObjectId,
      ref: "Course",
      required: true,
    },
    maxSlots: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    details: {
      type: Array,
      required: true,
    },
    mentorProfile: {
      type: String,
      required: true,
    },
    variantCost: {
      type: Number,
      required: true,
    },
    variantSlug: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Variant", variantSchema);
