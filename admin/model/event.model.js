const mongoose = require("mongoose");
const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  description: { type: String, default: "" },
  status: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Number,
    default: Date.now(),
  },
  date: {
    type: Date,
    default: new Date(),
  },
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
