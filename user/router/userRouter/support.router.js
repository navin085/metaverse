const express = require("express");


const supportController = require("../../controller/support.controller");
const authController = require("../../controller/userAuth.controller");
const router = express.Router();
router.use(authController.protect);

// router.get('/get/ticket/:id', supportController.getTicketById);
router.post(
'/ticketRise',
supportController.uploadUserPhoto, 
supportController.resizeUserPhoto, 
supportController.ticketRise
);

router.post('/update_status/:id',
supportController.updateStatus);

router.post('/add-question/:id', 
supportController.uploadUserPhoto, 
supportController.resizeUserPhoto, 
supportController.addQuestion
);

router.get('/get_user_ticket', supportController.getSingleUsersAllTickets);

module.exports = router;