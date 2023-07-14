const Model = require("../model/avatar.model");
const User = require("../model/user.model");
const catchAsync = require("../../utills/catchAsync");
const AppError = require("../../utills/appError");

exports.createAvatar = catchAsync(async(req, res, next) => {
    const { avatarName, gender, skinEffect, outfits, glasses, hairStyle, beardStyle } = req.body;


     // Check if the user exists
  const user = await User.findOne({ _id: req.user._id });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

    // Check if user data already exists
    const existingAppearance = await Model.findOne({ playerId: req.user._id });
  
    if (existingAppearance) {
      // Update the existing user data
      existingAppearance.avatarName = avatarName;
      existingAppearance.gender = gender;
      existingAppearance.skinEffect = skinEffect;
      existingAppearance.outfits = outfits;
      existingAppearance.glasses = glasses;
      existingAppearance.hairStyle = hairStyle;
      existingAppearance.beardStyle = beardStyle;
      await existingAppearance.save();
    } else {
      // Create new user data
      const newAppearance = new Model({
        playerId: req.user._id,
        avatarName,
        gender,
        skinEffect,
        outfits,
        glasses,
        hairStyle,
        beardStyle,
      });
      await newAppearance.save();
    }
  
    res.status(200).json({ success: true, message: "User avatar data created/updated successfully" });
});


exports.getAvatarByUser = catchAsync(async (req, res, next) => {
  const userId = req.user._id; // Assuming the user ID is passed as a URL parameter

  // Find the user by ID
  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Find the appearance data for the user
  const appearance = await Model.findOne({ playerId: userId })
  .populate("playerId")

  if (!appearance) {
    return next(new AppError("Data not found", 404));
  }

  res.status(200).json({ success: true, appearance });
});