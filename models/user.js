import mongoose from "mongoose";
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      trim: true,
      required: false,
      min: 6,
      max: 64,
    },
    role: {
      type: Number,
      default: 0,
    },
    phone: {
      type: String,
      trim: true,
    },
    courses: [
      {
        type: ObjectId,
        ref: "Variant",
        required: false,
      },
    ],
    maxCourseSlots: [{ type: Number, required: false }],
    refresh_token: {
      type: String,
      required: false,
    },
    paymentStatus: {
      type: String,
      required: false,
    },
    mentoredCourses: [
      {
        type: ObjectId,
        ref: "Course",
        required: false,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
