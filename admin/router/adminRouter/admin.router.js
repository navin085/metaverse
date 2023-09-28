const express = require("express");
const adminController = require("../../controller/admin.controller");
const authController = require("../../controller/auth.controller");
const userController = require("../../../user/controller/user.controller");
const supportController = require("../../../user/controller/support.controller");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.post("/reset/:token", authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch("/updateMyPassword",  authController.updatePassword);
router.get("/me", adminController.getMe, adminController.getUser);
router.patch(
  "/updateMe",
  adminController.uploadUserPhoto,
  adminController.resizeUserPhoto,
  adminController.updateMe
);
router.delete("/deleteMe", adminController.deleteMe);

//User
router.get('/get/all_users', userController.getAll_users);

//support
router.put('/reply-ticket/:id', supportController.replyTicket);
router.get('/getAll/ticket', supportController.getAllTicket);
router.post('/delete-ticket/:id', supportController.deleteTicket);
router.get('/get/ticket/:id', supportController.getTicketById);

module.exports = router;
