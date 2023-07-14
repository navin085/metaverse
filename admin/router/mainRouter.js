const adminRouter = require("./adminRouter/admin.router")
const express = require('express');
const router = express.Router();

router.use("/admin", 
adminRouter
);

module.exports = router;