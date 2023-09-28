const express = require("express");
const eventController = require("../../controller/event.controller");
const authController = require("../../controller/auth.controller");

const router = express.Router();
router.use(authController.protect);

router.get('/getAll/event', eventController.getAllEvents);
router.get('/get/event/:id', eventController.getEventById);
router.post('/create-event',  eventController.createEvent);
router.put('/update-event/:id', eventController.updateEvent);
router.post('/delete-event/:id', eventController.deleteEvent);

module.exports = router;