const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../model/user.model");
const catchAsync = require("../../utills/catchAsync");
const AppError = require("../../utills/appError");
const Email = require("../../utills/email");
const requestIp = require("request-ip");
const geoip = require("geoip-lite");
const axios = require('axios');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    expiresIn: 86400,
    data: user,
  });
};

const signTokenForVerification = (user) => {
  const MINUTES_IN_A_HOUR = 60;
  const EXPIRE_TIME_IN_MINUTES = 5;
  const EXPIRE_TIME_IN_SECONDS = EXPIRE_TIME_IN_MINUTES * MINUTES_IN_A_HOUR;

  return jwt.sign({ user }, process.env.JWT_SECRET, {
    expiresIn: EXPIRE_TIME_IN_SECONDS,
  });
};

const createSendTokenVerify = (user, statusCode, req, res) => {
  const token = signTokenForVerification(user);

  res.cookie("jwt", token, {
    expires: new Date(Date.now() + 60 * 24 * 3600000),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  });

  user.password = undefined;

  let verificationLink = ` http://localhost:8080/api/v1/metaverse/user/verifyUser/${user.email}/${token}`;

  // Send verification email
   new Email(user, "passowrd", verificationLink).sendVerificationEmail();

  res.status(statusCode).json({
    status: "success",
    message: "Verification link has been sent to the user's email.",
  });
};

exports.signup = catchAsync(async (req, res, next) => { 
  let {
    name,
    email,
    password,
    passwordConfirm,
    gender,
  } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (user) {
    return next(new AppError("Email already exists!", 401));
  }

  const newUser = new User({
    name,
    email,
    password,
    passwordConfirm,
    gender,
    verified: false,
});

  createSendTokenVerify(newUser, 201, req, res);
});

exports.verifyUser = catchAsync(async (req, res, next) => {
  const token = req.params.token;
  const email = req.params.email;

  if (!token) {
    return next(new AppError("Account activation error!", 403));
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (decodedToken.user.email !== email) {
      return next(
        new AppError(
          "Incorrect or invalid verification link. Please register again.",
          403
        )
      );
    }

    let existingUser = await User.findOne({ email });

    if (!existingUser) {
      const newUser = await User.create({
        name: decodedToken.user.name,
        email: decodedToken.user.email,
        password: decodedToken.user.password,
        passwordConfirm: decodedToken.user.passwordConfirm,
        gender: decodedToken.user.gender,
        verified: true
      });
  
      // Remove sensitive data from output
      newUser.password = undefined;
  
      res.status(200).json({
        status: "success",
        message: "Verification is completed. Thank you!",
      });
  
    
    }

    if (existingUser && existingUser.verified === true) {
      return next(new AppError("The verification link has expired. expired time", 403));
    }


  } catch (error) {
    console.log(error.message, "error");
    if (error.name === "TokenExpiredError") {
      return next(new AppError("The verification link has expired.", 403));
    }

    return next(
      new AppError(
        "Incorrect or invalid verification link. Please register again.",
        403
      )
    );
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 4) If everything is okay, send token to the client
  createSendToken(user, 200, req, res);
});


exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }
  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return async (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  console.log(user)
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `http://localhost:8080/api/v1/metaverse/user/reset/${resetToken}`;

    new Email(user, "", resetURL).sendForgotPasswordEmail();

    res.status(200).json({
      status: "success",
      message:
        "Password reset link sent to email ID. Please follow the instructions.",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  if (req.body.password != req.body.passwordConfirm) {
    return next(
      new AppError("Password does not match with confirm password", 400)
    );
  }
  if (req.body.password.length < 8) {
    return next(new AppError("Password must be 8 numbers", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  // const user = await User.findById(req.params.id).select("+password");
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  if (req.body.password !== req.body.passwordConfirm) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, req, res);
});

exports.getPlayerLocation = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // 1) Check if user exists
  if (!user) {
    return next(new AppError("User not found", 401));
  }

  console.log(req.ip);

  // 2) Fetch player's location using IP geolocation
  const playerIp = req.ip; // Assuming req.ip holds the player's IP address
  const playerLocation = await getLocationByIp(playerIp);

  res.status(200).json({
    status: "success",
    message: "Get player location successfully",
    data: playerLocation,
  });
});


async function getLocationByIp(ip) {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${ip}`
    );
  
    const { results } = response.data;
    if (results && results.length > 0) {
      const { formatted_address, address_components } = results[0];
  
      const country = getComponentValue(address_components, 'country');
      const region = getComponentValue(address_components, 'administrative_area_level_1');
      const city = getComponentValue(address_components, 'locality');
  
      return {
        ip,
        country,
        region,
        city,
        formatted_address
      };
    }
  } catch (error) {
    console.error(error);
  }
  
  return null;
}

function getComponentValue(addressComponents, type) {
  const component = addressComponents.find(component =>
    component.types.includes(type)
  );
  
  return component ? component.long_name : '';
}
