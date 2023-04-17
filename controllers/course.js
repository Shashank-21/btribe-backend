import slugify from "slugify";
import Course from "../models/course.js";
import Variant from "../models/variant.js";

export const createCourse = async (request, response) => {
  try {
    const { name, imageLink } = request.body;
    if (!name.trim()) {
      return response.json({ error: "Name required" });
    }
    if (!imageLink.trim()) {
      return response.json({ error: "ImageLink required" });
    }
    const existingCourse = await Course.findOne({ name });
    if (existingCourse) {
      return response.json({
        error: `Course by name ${name} already exists!`,
      });
    }
    const course = await new Course({
      name,
      variants: [],
      imageLink,
      slug: slugify(name).toLowerCase(),
    }).save();
    response.json(course);
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};
export const listCourse = async (request, response) => {
  try {
    const all = await Course.find({}).populate("variants");
    response.json(all);
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};
export const readCourse = async (request, response) => {
  try {
    const { slug } = request.params;
    const course = await Course.findOne({ slug }).populate("variants");
    if (course) {
      response.json(course);
    } else {
      response.status(400).send({ message: "Course not found" });
    }
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};
export const updateCourse = async (request, response) => {
  try {
    const { name, imageLink } = request.body;
    const { courseId: course } = request.params;
    const variantSchemas = await Variant.find({ course });
    const variants = variantSchemas.map((variant) => variant._id);
    const updatedCourse = await Course.findByIdAndUpdate(
      course,
      {
        name,
        imageLink,
        variants,
        slug: slugify(name).toLowerCase(),
      },
      { new: true }
    ).populate("variants");
    response.json(updatedCourse);
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};
export const deleteCourse = async (request, response) => {
  try {
    const { courseId } = request.params;
    const removed = await Course.findByIdAndDelete(courseId);
    response.json(removed);
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};
