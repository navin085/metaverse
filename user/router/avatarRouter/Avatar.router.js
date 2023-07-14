const express = require("express");
const appearanceController = require("../../controller/avatarController");
const authController = require("../../controller/userAuth.controller");

const router = express.Router();

router.use(authController.protect);

router.post("/createAvatar", appearanceController.createAvatar);

router.get("/getAvatar", appearanceController.getAvatarByUser);

module.exports = router;