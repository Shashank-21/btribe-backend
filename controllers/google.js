import axios from "axios";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import Course from "../models/course.js";

export const loginGoogle =
  (authClient, redirectLinks, role) => async (request, response) => {
    try {
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
      if (user) {
        const { refresh_token } = user;
        if (refresh_token) {
          authClient.setCredentials({
            ...authClient.credentials,
            refresh_token,
          });
          authClient.refreshAccessToken();
        }
        if (tokens.refresh_token) {
          await user.updateOne({ refresh_token });
        }
        redirectUrl = existingUserLink;
      } else {
        user = await new User({
          name,
          email,
          role,
          refresh_token: authClient.credentials.refresh_token || "",
        }).save();

        redirectUrl = newUserLink;
      }
      authClient.on("tokens", (tokens) => {
        if (tokens.refresh_token) {
          console.log(tokens);
          User.findOneAndUpdate(
            { email },
            { refresh_token: tokens.refresh_token },
            { new: true }
          );
          authClient.setCredentials({
            ...authClient.credentials,
            refresh_token: tokens.refresh_token,
          });
          authClient.refreshAccessToken();
        }
      });
      redirectUrl = `${redirectUrl}?access_token=${authClient.credentials.access_token}`;
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
        },
        token,
      });
    }
    console.log("success");
  } catch (error) {
    console.log("error");
    response.status(400).send(error);
  }
};
