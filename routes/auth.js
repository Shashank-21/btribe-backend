import express from "express";
import dotenv from "dotenv";
import {
  registerUser,
  loginUser,
  secret,
  deleteUser,
  updateUser,
  fetchMentors,
} from "../controllers/auth.js";
import { google } from "googleapis";
import { requireSignIn, isMentor } from "../middlewares/auth.js";
import { fetchGoogleUser, loginGoogle } from "../controllers/google.js";

dotenv.config();

const router = express.Router();

const getClient = (redirectUri) => {
  return new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    redirectUri
  );
};

const calendar = google.calendar({ version: "v3", auth: process.env.API_KEY });

const scopes = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

router.get("/login/google/mentor", async (request, response) => {
  const authClientMentor = getClient(process.env.REDIRECT_URI_MENTOR);
  const url = authClientMentor.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });

  response.redirect(url);
});
router.get("/login/google/student", async (request, response) => {
  const authClientStudent = getClient(process.env.REDIRECT_URI_STUDENT);
  const url = authClientStudent.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });

  response.redirect(url);
});

router.post("/register", registerUser);

router.get(
  "/get-mentor-from-client",
  loginGoogle(
    getClient(process.env.REDIRECT_URI_MENTOR),
    {
      newUserLink: "http://mentor.localhost:5173/register/details",
      existingUserLink: "http://mentor.localhost:5173/dashboard",
    },
    1
  )
);

router.get(
  "/get-student-from-client",
  loginGoogle(
    getClient(process.env.REDIRECT_URI_STUDENT),
    {
      newUserLink: "http://student.localhost:5173/register/details",
      existingUserLink: "http://student.localhost:5173/dashboard",
    },
    0
  )
);

router.get("/fetch-mentor-data", fetchGoogleUser(1));
router.get("/fetch-student-data", fetchGoogleUser(0));

router.get("/send-calendar-invite", async (request, response) => {
  //get slot id from request
  //retreive mentor and student email from the slot.
  //authClient - mentor's login client.
  //send event with creator as mentor, attendees - mentor and student. Start - Slot time. End, slot time plus half an hour. Add conference details (Meet link)
  //Response - 'Meeting invite sent';
  ///IfError, then response === error
});

router.post("/login", loginUser);
router.get("/auth-check", requireSignIn, (request, response) => {
  response.json({ ok: true });
});
router.put("/user/:userId", updateUser);
router.delete("/user/:userId", requireSignIn, deleteUser);
router.get("/secret", requireSignIn, isMentor, secret);
router.get("/mentors", requireSignIn, fetchMentors);
export default router;
