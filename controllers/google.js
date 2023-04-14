import axios from "axios";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import Course from "../models/course.js";
import { google } from "googleapis";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const getClient = (redirectUri) => {
  return new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    redirectUri
  );
};

export const calendar = google.calendar({
  version: "v3",
  auth: process.env.API_KEY,
});

export const scopes = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export const loginGoogle = (redirectUri) => async (request, response) => {
  try {
    console.log(scopes);
    const authClient = getClient(redirectUri);
    const url = authClient.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
    });

    response.redirect(url);
  } catch (error) {
    console.log(error);
    response.status(400).json(error);
  }
};

export const loginGoogleRedirect =
  (authClient, redirectLinks, role) => async (request, response) => {
    try {
      const roles = ["student", "mentor", "admin"];
      const { newUserLink, existingUserLink } = redirectLinks;
      let redirectUrl, user;
      const { tokens } = await authClient.getToken(request.query.code);

      authClient.setCredentials(tokens);

      const { data } = await axios.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${authClient.credentials.access_token}`,
          },
        }
      );
      const { name, email } = data;
      user = await User.findOne({ email });
      console.log(user);
      if (user) {
        if (user.role !== role) {
          redirectUrl = `${process.env.FRONTEND_BASE_URL}?reason=unauthorized`;
          return response.redirect(redirectUrl);
        }
        const { refresh_token } = user;
        if (refresh_token) {
          if (refresh_token && !authClient.credentials.refresh_token) {
            authClient.setCredentials({
              ...authClient.credentials,
              refresh_token,
            });
            authClient.refreshAccessToken();
          }
        } else {
          if (tokens.refresh_token) {
            await user.updateOne({ refresh_token: tokens.refresh_token });
          }
        }
        if (user.role !== 0) {
          await user.updateOne(
            { credentials: authClient.credentials },
            { new: true }
          );
        }
        redirectUrl = existingUserLink;
      } else {
        if (role === 1 || role === 2) {
          user = await new User({
            name,
            email,
            role,
            refresh_token: authClient.credentials.refresh_token || "",
            approvalStatus: "pending",
            credentials: authClient.credentials,
          }).save();
          //Email confirming registration
          const emailData = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `Thanks for choosing to be a BTribe Mentor!`,
            html: `<p>Dear ${name}.<br /><br />Thank you for choosing to be a BTribe Mentor.<br /><br />Your account is yet to be approved. Meanwhile, we recommend you to go through this doc(To be replaced by platform operation doc link) to understand how the platform works.<br /><br />Best,<br />BTribe</p>`,
          };

          try {
            await sgMail.send(emailData);
            console.log("Email sent");
          } catch (error) {
            console.log(error);
          }

          redirectUrl = newUserLink;
        } else {
          redirectUrl = `${process.env.FRONTEND_BASE_URL}?reason=unauthorized`;
          return response.redirect(redirectUrl);
        }
      }
      redirectUrl = `${redirectUrl}?access_token=${authClient.credentials.access_token}&role=${roles[role]}`;
      response.redirect(redirectUrl);
    } catch (error) {
      console.log(error);
      response.status(400).json(error);
    }
  };

export const fetchGoogleUser = (role) => async (request, response) => {
  try {
    const { access_token } = request.query;
    const { data } = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    const { email } = data;
    let user;

    if (role === 0) {
      user = await User.findOne({ email }).populate({
        path: "courses",
        populate: { path: "course", model: Course },
      });
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      response.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || "",
          courses: user.courses || [],
          maxCourseSlots: user.maxCourseSlots || [],
          paymentStatus: user.paymentStatus || "",
          approvalStatus: user.approvalStatus,
        },
        token,
      });
    } else if (role === 1) {
      user = await User.findOne({ email }).populate("mentoredCourses");
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      response.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || "",
          mentoredCourses: user.mentoredCourses || [],
          approvalStatus: user.approvalStatus,
        },
        token,
      });
    } else if (role === 2) {
      user = await User.findOne({ email });
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      response.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || "",
          mentoredCourses: user.mentoredCourses || [],
          approvalStatus: user.approvalStatus,
        },
        token,
      });
    }
  } catch (error) {
    response.status(400).send(error);
  }
};
