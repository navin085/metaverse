
const express = require('express');
const router = express.Router();

const userRouter = require("./userRouter/user.router");
const avatarRouter = require("./avatarRouter/Avatar.router");
const supportRouter = require("./userRouter/support.router");

router.use("/user", 
userRouter,
avatarRouter,
supportRouter
);



module.exports = router;