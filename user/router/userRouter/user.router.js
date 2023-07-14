const express = require("express");
const authController = require("../../controller/userAuth.controller");
const userController = require("../../controller/user.controller");

const router = express.Router();

router.post("/signup", authController.signup);

router.post("/login", authController.login);

router.get("/verifyUser/:email/:token", authController.verifyUser);

router.post("/forgotPassword", authController.forgotPassword);

router.post("/reset/:token", authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch("/updatePassword", authController.updatePassword);

router.get("/getPlayerLocation", authController.getPlayerLocation);

router.get("/getProfile", userController.getMe, userController.getUser);
router.patch(
  "/updateProfile",
  userController.updateMe
);
router.post("/deleteAccount", userController.deleteMe);

module.exports = router;
