const userRouter = require("./userRouter/user.router")
const express = require('express');
const router = express.Router();

router.use("/user", 
userRouter
);

module.exports = router;