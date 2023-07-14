const express = require("express");
const adminController = require("../../controller/admin.controller");
const authController = require("../../controller/auth.controller");

const router = express.Router();

router.post("/signup", authController.signup);

router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword);

router.post("/reset/:token", authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch("/updateMyPassword", authController.updatePassword);
router.get("/me", adminController.getMe, adminController.getUser);
router.patch(
  "/updateMe",
  adminController.uploadUserPhoto,
  adminController.resizeUserPhoto,
  adminController.updateMe
);
router.delete("/deleteMe", adminController.deleteMe);

module.exports = router;
