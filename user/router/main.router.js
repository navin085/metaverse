const userRouter = require("./userRouter/user.router");
const avatarRouter = require("./avatarRouter/Avatar.router");
const express = require('express');
const router = express.Router();

router.use("/user", 
userRouter,
avatarRouter
);

module.exports = router;