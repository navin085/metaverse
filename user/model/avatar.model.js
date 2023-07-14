
const mongoose = require('mongoose');

const AvatarSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  avatarName: {
    type: String
  },
  gender: {
    type: String
  },
  skinEffect: {
    type: Number
  },
  outfits: {
    type: Number
  },
  glasses: {
    type: Number
  },
  hairStyle: {
    type: Number
  },
  beardStyle: {
    type: Number
  },
  createdAt: {
    type: Number,
    default: Date.now(),
  },
  date: {
    type: Date,
    default: new Date(),
  }
});


const Avatar = mongoose.model('Avatar', AvatarSchema);

module.exports = Avatar;
