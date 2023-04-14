import mongoose from "mongoose";
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

export const courseSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    variants: [
      {
        type: ObjectId,
        ref: "Variant",
        required: false,
      },
    ],
    imageLink: {
      type: String,
      trim: true,
      required: true,
    },
    slug: {
      type: String,
      trim: true,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
