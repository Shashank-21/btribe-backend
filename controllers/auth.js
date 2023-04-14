import User from "../models/user.js";
import Course from "../models/course.js";
import { hashPassword, comparePassword } from "../helpers/auth.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import variant from "../models/variant.js";
import sgMail from "@sendgrid/mail";
import { getClient } from "./google.js";

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
      approvalStatus,
      orderDetails,
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
      password: hashedPassword || "",
      phone: phone,
      role,
      courses,
      maxCourseSlots,
      paymentStatus,
      approvalStatus,
      orderDetails,
    }).save();
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const course = await variant
      .findById(courses[courses.length - 1])
      .populate("course");

    console.log(course);

    //Welcome email.
    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Welcome to ${course.course.name} - ${course.name} course, ${name}!`,
      html: `
        <p>Dear ${name}<br /><br />Trust you're geared up for BTribe's GDPI-WAT Cracker, you will soon receive <strong>Google drive access</strong> to the GDPI-WAT Cracker 2023 folder to your registered email ID <br /> <br />Please join this GDPI-WAT telegram group:<br/><a href="https://telegram.me/+oQw0qAdQfQ83MTk1" target="_blank">https://telegram.me/+oQw0qAdQfQ83MTk1</a> <br /><br />Please join this announcement GDPI-WAT telegram group:<br /><a href="https://telegram.me/+Wtx3F0yaHa8zY2Q1" target="_blank">https://telegram.me/+Wtx3F0yaHa8zY2Q1</a><br /><br /><strong>Joining instructions:</strong><br /><a href="https://docs.google.com/document/d/10ifE0a0q1KxhquK3oZT0ccQi8HnDegGY8ie_kpD7AmM/edit?usp=sharing" target="_blank">https://docs.google.com/document/d/10ifE0a0q1KxhquK3oZT0ccQi8HnDegGY8ie_kpD7AmM/edit?usp=sharing</a><br /><br />Access all the video recordings and material from your registered ID here:<br /><a href="https://drive.google.com/drive/folders/16ZB_SfaRrp1ZrR5WIwWpZIFziS8AwGY2?usp=sharing" target="_blank">https://drive.google.com/drive/folders/16ZB_SfaRrp1ZrR5WIwWpZIFziS8AwGY2?usp=sharing</a><br /><br />And this generic B-Tribe member group: <a href="https://telegram.me/joinchat/JqaY-uwlJa05Yjll" target="_blank">https://telegram.me/joinchat/JqaY-uwlJa05Yjll</a><br /><br />Here's what you get from the GDPI-WAT Cracker that others don't:<ul><li>Personal interview training</li><li>10 Mock PIs</li><li>Unlimited Mock GDs</li><li>B-school-specific interview insights</li><li>Flagship resume building workshop</li><li>Regular GK material</li><li>Answering tough questions</li><li>WAT preparation</li><li>Careers after MBA</li><li>Marketing</li><li>Strategy/ Consulting</li><li>Product Management</li><li>Operations</li><li>Basic finance</li><li>Economics</li><li>Life in a B school</li></ul><br />While we will do all of this and much more (yeah! request us for more mock PIs if you need and we'll try our best to arrange them! No extra cost!), it's up to you to make the best out of this course.<br /><br />Best.<br />BTribe</p>
      `,
    };

    try {
      await sgMail.send(emailData);
    } catch (error) {
      console.log(error);
    }

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
        approvalStatus: user.approvalStatus,
        orderDetails: user.orderDetails,
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
    console.log(!email, password);
    //2. Validate all responses
    if (!email) {
      console.log("Email not found");
      return response.json({ error: "Email is required" });
    }
    if (!password || password.length < 6) {
      return response.json({
        error: "Password must be at least 6 characters long",
      });
    }

    //3.Find user in database. If not found, send error.
    const user = await User.findOne({ email }).populate({
      path: "courses",
      populate: { path: "course", model: Course },
    });

    console.log(user);
    if (!user) {
      return response.json({ error: "User not found" });
    }

    //4. Compare password: 23123k1j23b1kj23b
    const match = await comparePassword(password, user.password);
    if (!match) {
      return response.json({ error: "Wrong Password" });
    }

    //5. Create signed JWT
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
        approvalStatus: user.approvalStatus,
        maxCourseSlots: user.maxCourseSlots,
        paymentStatus: user.paymentStatus,
      },
      token,
    });
  } catch (error) {
    console.log(error);
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
      password,
      maxCourseSlots,
      paymentStatus,
      mentoredCourses,
      approvalStatus,
      institute,
      company,
    } = request.body;
    let user, hashedPassword;
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
      if (password) {
        if (password.length < 6) {
          return response.json({
            error: "Password must be at least 6 characters long",
          });
        }
        hashedPassword = await hashPassword(password);
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
          approvalStatus,
          password: hashedPassword || "",
        },
        { new: true }
      ).populate({
        path: "courses",
        populate: { path: "course", model: Course },
      });
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
          approvalStatus: user.approvalStatus,
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
          approvalStatus,
          institute: institute || "",
          company: company || "",
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
          approvalStatus: user.approvalStatus,
          institute: user.institute,
          company: user.company,
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
    const roles = ["student", "mentor", "admin"];
    const { userId } = request.params;
    const user = await User.findByIdAndDelete(userId);
    if (user.role === 1) {
      const authClient = getClient(process.env.REDIRECT_URI_MENTOR);
      authClient.setCredentials(user.credentials);
      authClient.revokeToken(authClient.credentials.access_token);
    } else if (user.role === 2) {
      const authClient = getClient(process.env.REDIRECT_URI_ADMIN);
      authClient.setCredentials(user.credentials);
      authClient.revokeToken(authClient.credentials.access_token);
    }

    const emailData = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `Your ${roles[user.role]} account has not been approved`,
      html: `<p>Dear ${user.name}.<br /><br />Thank you for choosing to be a part of BTribe!<br /><br />Our admins have reviewed your profile and decided that this collaboration won't work. You could try again after 3 months<br/><br/></p>Best,<br />BTribe</p>`,
    };

    try {
      await sgMail.send(emailData);
    } catch (error) {
      console.log(error);
    }

    response.json(user);
  } catch (error) {
    console.log(error);
    response.status(400).json(error);
  }
};

export const fetchApprovedMentors = async (request, response) => {
  try {
    const mentors = await User.find({
      role: 1,
      approvalStatus: "approved",
    }).populate("mentoredCourses");
    response.json(mentors);
  } catch (error) {
    response.status(400).json(error);
  }
};

export const secret = async (request, response) => {
  await response.json({ currentUser: request.user });
};

export const authCheckUser = (request, response) => {
  try {
    response.json({ ok: true });
  } catch (error) {
    response.status(400).json(error);
  }
};

export const approveUserRole = async (request, response) => {
  try {
    const roles = ["student", "mentor", "admin"];
    const { userId } = request.params;
    const { mentoredCourses } = request.body;
    let user, emailData;
    if (mentoredCourses) {
      user = await User.findByIdAndUpdate(
        userId,
        { approvalStatus: "approved", mentoredCourses },
        { new: true }
      ).populate("mentoredCourses");
      //Approval email.
      emailData = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: `Congratulations, your ${
          roles[user.role]
        } account has been approved!`,
        html: `<p>Dear ${
          user.name
        }.<br /><br />Thank you for choosing to be a part of BTribe!<br /><br />Our admins have reviewed your profile and chosen you to be a part of our journey. We recommend you to go through this doc(To be replaced by platform operation doc link) to understand how the platform works.<br /><br />You have been approved for these courses:</p><ul>${user.mentoredCourses.map(
          (course) => {
            return `<li>${course.name}</li>`;
          }
        )}</ul><br/></p>Best,<br />BTribe</p>`,
      };
    } else {
      user = await User.findByIdAndUpdate(
        userId,
        { approvalStatus: "approved" },
        { new: true }
      );
      emailData = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: `Congratulations, your ${
          roles[user.role]
        } account has been approved!`,
        html: `<p>Dear ${user.name}.<br /><br />Thank you for choosing to be a part of BTribe!<br /><br />Our admins have reviewed your profile and chosen you to be a part of our journey. We recommend you to go through this doc(To be replaced by platform operation doc link) to understand how the platform works.<br /><br /></p>Best,<br />BTribe</p>`,
      };
    }

    try {
      await sgMail.send(emailData);
    } catch (error) {
      console.log(error);
    }
    response.json(user);
  } catch (error) {
    response.status(400).json(error);
  }
};

export const listPendingApprovalUsers = async (request, response) => {
  try {
    const users = await User.find({ approvalStatus: "pending" })
      .select("-credentials")
      .populate("mentoredCourses");
    response.json(users);
  } catch (error) {
    response.status(400).json(error);
  }
};

//Deprecate afterwards
export const deleteStudentsAndMentors = async (request, response) => {
  try {
    const allUsers = await User.find({});
    const studentsAndMentors = allUsers.filter((user) => user.role !== 2);
    for (let user of studentsAndMentors) {
      await User.findByIdAndDelete(user._id);
    }
    response.json({ status: "done" });
  } catch (error) {
    console.log(error);
    response.status(400).json(error);
  }
};

export const deleteStudents = async (request, response) => {
  try {
    const allUsers = await User.find({});
    const studentsAndMentors = allUsers.filter((user) => user.role === 0);
    for (let user of studentsAndMentors) {
      await User.findByIdAndDelete(user._id);
    }
    response.json({ status: "done" });
  } catch (error) {
    console.log(error);
    response.status(400).json(error);
  }
};

//Endpoint for reset password [password reset email];
export const resetPasswordRequest = async (request, response) => {
  try {
    const { email } = request.body;
    const user = await User.findOne({ email });
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const redirectUrl = `${process.env.FRONTEND_BASE_URL}/reset-password?token=${token}`;
    console.log(redirectUrl);
    const emailBody = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Reset password",
      html: `<p>Click <a href=${redirectUrl}>here </a> to reest your password`,
    };

    try {
      await sgMail.send(emailBody);
    } catch (error) {
      console.log(error);
    }
    response.json({ email: "sent" });
  } catch (error) {
    response.status(400).json(error);
  }
};

export const resetPasswordVerify = async (request, response) => {
  try {
    const user = await User.findById(request.user._id);
    response.json({ email: user.email });
  } catch (error) {
    console.log(error);
    response.status(400).json(error);
  }
};

export const resetPassword = async (request, response) => {
  try {
    const { email, password } = request.body;
    console.log(email);
    const hashedPassword = await hashPassword(password);
    const user = await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    console.log(user);

    const emailBody = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Password Changed",
      html: `<p>Click <a href=${`${process.env.FRONTEND_BASE_URL}/student/login`}>here </a> to login with your new password`,
    };

    try {
      await sgMail.send(emailBody);
    } catch (error) {
      console.log(error);
    }
    response.json({ status: "done" });
  } catch (error) {
    console.log(error);
    response.status(400).json(error);
  }
};
