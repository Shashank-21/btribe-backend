import Variant from "../models/variant.js";
import slugify from "slugify";
import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

export const createVariant = async (request, response) => {
  try {
    const { name, maxSlots, description, details, mentorProfile, variantCost } =
      request.body;
    const { courseId } = request.params;
    if (!name.trim()) {
      return response.json({ error: "Name required" });
    }
    if (!variantCost) {
      return response.json({ error: "Cost is required" });
    }
    const existingVariant = await Variant.findOne({
      name,
      _id: new ObjectId(courseId),
    });
    if (existingVariant) {
      return response.json({
        error: `Course Variant by name ${name} already exists!`,
      });
    }
    const variant = await new Variant({
      name,
      course: courseId,
      maxSlots: maxSlots || 0,
      description: description || "",
      details: details || [],
      mentorProfile: mentorProfile || "",
      variantCost,
      variantSlug: slugify(name).toLowerCase(),
    }).save();
    response.json(variant);
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};
export const listVariantsByCourse = async (request, response) => {
  try {
    const { courseId: course } = request.params;
    const all = await Variant.find({ course }).populate("course");
    response.json(all);
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};
export const readVariant = async (request, response) => {
  try {
    const { variantSlug } = request.params;
    const variant = await Variant.findOne({ variantSlug }).populate("course");
    response.json(variant);
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};
export const updateVariant = async (request, response) => {
  try {
    const { name, maxSlots, description, details, mentorProfile, variantCost } =
      request.body;
    const { variantId } = request.params;
    const variant = await Variant.findByIdAndUpdate(
      variantId,
      {
        name,
        maxSlots,
        description,
        details,
        mentorProfile,
        variantCost,
        variantSlug: slugify(name).toLowerCase(),
      },
      { new: true }
    );
    response.json(variant);
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};
export const deleteVariant = async (request, response) => {
  try {
    const { variantId } = request.params;
    const removed = await Variant.findByIdAndDelete(variantId);
    response.json(removed);
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};
