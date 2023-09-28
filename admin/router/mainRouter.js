const adminRouter = require("./adminRouter/admin.router");
const eventRouter = require("./adminRouter/event.router");
const express = require('express');
const router = express.Router();

router.use("/admin", 
adminRouter,
eventRouter
);

module.exports = router;