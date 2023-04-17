import User from "../models/user.js";
import { hashPassword, comparePassword } from "../helpers/auth.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const registerUser = async (request, response) => {
  try {
    //1. Destructure name, email and password from request.body
    const {
      name,
      email,
      phone,
      password,
      role,
      courses,
      maxCourseSlots,
      paymentStatus,
    } = request.body;

    //2. Validate all responses
    if (!name.trim()) {
      return response.json({ error: "Name is required" });
    }
    if (!email) {
      return response.json({ error: "Email is required" });
    }
    if (role !== 0 && !role) {
      return response.json({ error: "Role is required" });
    }

    let user, hashedPassword;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return response.json({ error: "Email is already taken" });
    }

    if (password) {
      if (password.length < 6) {
        return response.json({
          error: "Password must be at least 6 characters long",
        });
      }
      hashedPassword = await hashPassword(password);
    }

    user = await new User({
      name,
      email,
      password: hashedPassword,
      phone: phone,
      role,
      courses,
      maxCourseSlots,
      paymentStatus,
    })
      .populate("courses")
      .save();
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    //7. Send Response
    response.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        courses: user.courses,
        maxCourseSlots: user.maxCourseSlots,
      },
      token,
    });
  } catch (error) {
    console.log(error);
  }
};

export const loginUser = async (request, response) => {
  try {
    //1. Destructure name, email and password from request.body
    const { email, password } = request.body;

    //2. Validate all responses
    if (!email) {
      return response.json({ error: "Email is required" });
    }
    if (!password || password.length < 6) {
      return response.json({
        error: "Password must be at least 6 characters long",
      });
    }

    //3.Find user in database. If not found, send error.
    const user = await User.findOne({ email });
    if (!user) {
      return response.json({ error: "User not found" });
    }

    //4. Compare password: 23123k1j23b1kj23b
    const match = await comparePassword(password, existingUser.password);
    if (!match) {
      return response.json({ error: "Wrong Password" });
    }

    //5. Create signed JWT
    const token = jwt.sign({ _id: existingUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    //7. Send Response
    response.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        courses: user.courses,

        maxCourseSlots: user.maxCourseSlots,
        paymentStatus: user.paymentStatus,
      },
      token,
    });
  } catch (error) {
    console.log("Error");
  }
};

export const updateUser = async (request, response) => {
  try {
    const { userId } = request.params;
    const {
      name,
      role,
      phone,
      courses,
      maxCourseSlots,
      paymentStatus,
      mentoredCourses,
    } = request.body;
    let user;
    if (role === 0) {
      console.log("student");
      //update fields relevant to student only
      if (!courses.length) {
        return response.json({ error: "Courses required" });
      }
      if (!maxCourseSlots.length) {
        return response.json({
          error: "Array containing the maximum slots for each course is needed",
        });
      }
      if (!paymentStatus) {
        return response.json({ error: "Payment status required" });
      }

      user = await User.findByIdAndUpdate(
        userId,
        {
          name,
          role,
          phone,
          courses,
          maxCourseSlots,
          paymentStatus,
        },
        { new: true }
      ).populate("courses");
      const token = jwt.sign({ _id: userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      response.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          courses: user.courses,
          maxCourseSlots: user.maxCourseSlots,
          paymentStatus: user.paymentStatus,
        },
        token,
      });
    } else if (role === 1) {
      console.log("mentor");
      //update fields relevant for mentor

      if (!mentoredCourses.length) {
        return response.json({ error: "What courses are you mentoring?" });
      }

      user = await User.findByIdAndUpdate(
        userId,
        {
          name,
          role,
          phone,
          mentoredCourses,
        },
        { new: true }
      ).populate("mentoredCourses");
      const token = jwt.sign({ _id: userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      response.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          mentoredCourses: user.mentoredCourses,
        },
        token,
      });
    }
  } catch (error) {
    console.log(error);
    response.status(400).json(error);
  }
};

export const deleteUser = async (request, response) => {
  try {
    const { userId } = request.body;
    const user = await User.findByIdAndDelete(userId);
    response.json(user);
  } catch (error) {
    response.status(400).json(error);
  }
};

export const fetchMentors = async (request, response) => {
  try {
    const mentors = await User.find({ role: 1 }).populate("mentoredCourses");
    response.json(mentors);
  } catch (error) {
    response.status(400).json(error);
  }
};

export const secret = async (request, response) => {
  await response.json({ currentUser: request.user });
};
