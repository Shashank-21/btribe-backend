import express from "express";
import dotenv from "dotenv";
import {
  registerUser,
  loginUser,
  deleteUser,
  updateUser,
  fetchApprovedMentors,
  authCheckUser,
  approveUserRole,
  listPendingApprovalUsers,
  deleteStudentsAndMentors,
  deleteStudents,
  resetPasswordRequest,
  resetPasswordVerify,
  resetPassword,
} from "../controllers/auth.js";
import {
  requireSignIn,
  isApprovedMentor,
  isApprovedAdmin,
} from "../middlewares/auth.js";
import {
  fetchGoogleUser,
  getClient,
  loginGoogle,
  loginGoogleRedirect,
} from "../controllers/google.js";

dotenv.config();

const router = express.Router();

router.get(
  "/login/google/mentor",
  loginGoogle(process.env.REDIRECT_URI_MENTOR)
);
router.get("/login/google/admin", loginGoogle(process.env.REDIRECT_URI_ADMIN));
router.get(
  "/login/google/student",
  loginGoogle(process.env.REDIRECT_URI_STUDENT)
);

router.post("/register", registerUser);

router.get(
  "/get-student-from-client",
  loginGoogleRedirect(
    getClient(process.env.REDIRECT_URI_STUDENT),
    {
      existingUserLink: `${process.env.FRONTEND_BASE_URL}/dashboard`,
    },
    0
  )
);

router.get(
  "/get-mentor-from-client",
  loginGoogleRedirect(
    getClient(process.env.REDIRECT_URI_MENTOR),
    {
      newUserLink: `${process.env.FRONTEND_BASE_URL}/mentor/register/details`,
      existingUserLink: `${process.env.FRONTEND_BASE_URL}/dashboard`,
    },
    1
  )
);
router.get(
  "/get-admin-from-client",
  loginGoogleRedirect(
    getClient(process.env.REDIRECT_URI_ADMIN),
    {
      newUserLink: `${process.env.FRONTEND_BASE_URL}/admin/register/details`,
      existingUserLink: `${process.env.FRONTEND_BASE_URL}/dashboard`,
    },
    2
  )
);

router.get("/fetch-student-data", fetchGoogleUser(0));
router.get("/fetch-mentor-data", fetchGoogleUser(1));
router.get("/fetch-admin-data", fetchGoogleUser(2));

router.post("/login", loginUser);
router.get("/auth-check", requireSignIn, authCheckUser);
router.put("/user/:userId", updateUser);
router.delete("/user/:userId", requireSignIn, isApprovedAdmin, deleteUser);
router.get(
  "/mentor-approval-check",
  requireSignIn,
  isApprovedMentor,
  authCheckUser
);
router.get(
  "/admin-approval-check",
  requireSignIn,
  isApprovedAdmin,
  authCheckUser
);
router.get("/mentors", requireSignIn, fetchApprovedMentors);

router.put("/approve/:userId", requireSignIn, isApprovedAdmin, approveUserRole);

router.get(
  "/pending-approvals",
  requireSignIn,
  isApprovedAdmin,
  listPendingApprovalUsers
);

router.delete(
  "/all-students-and-mentors",
  requireSignIn,
  isApprovedAdmin,
  deleteStudentsAndMentors
);
router.delete("/all-students", requireSignIn, isApprovedAdmin, deleteStudents);

router.post("/reset-password-request", resetPasswordRequest);
router.get("/reset-password-verify", requireSignIn, resetPasswordVerify);

router.put("/reset-password", resetPassword);

export default router;
