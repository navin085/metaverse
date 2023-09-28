const multer = require("multer");
const sharp = require("sharp");
const Event = require("../model/event.model");
const catchAsync = require("../../utills/catchAsync");
const AppError = require("../../utills/appError");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single("image");

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `event-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/map/${req.file.filename}`);

  next();
});

exports.createEvent = catchAsync(async (req, res, next) => {
  // Check if an event with the same name already exists
  const existingEvent = await Event.findOne({ eventName: req.body.eventName });

  if (existingEvent) {
    return res.status(400).json({
      status: "fail",
      message: "An event with the same name already exists.",
    });
  }

  // If no existing event with the same name, create the event
  const event = await Event.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      event,
    },
  });
});

exports.updateEvent = catchAsync(async (req, res, next) => {
  // // Check if the request includes a new image
  // if (req.file) {
  //   // Resize and save the new image
  //   req.file.filename = `event-${req.params.id}-${Date.now()}.jpeg`;
  //   await sharp(req.file.buffer)
  //     .resize(500, 500)
  //     .toFormat("jpeg")
  //     .jpeg({ quality: 90 })
  //     .toFile(`public/img/map/${req.file.filename}`);
  // }

  // Update event data
  const updatedData = {
    ...req.body,
    // mapImage: req.file ? req.file.filename : undefined, // Update the mapImage field if a new image was uploaded
  };

  const event = await Event.findByIdAndUpdate(req.params.id, updatedData, {
    new: true,
    runValidators: true,
  });
  
  if(!event) {
    return res.status(400).json({
      status: "fail",
      message: "not update",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      event,
    },
  });
});

exports.deleteEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({
      status: "fail",
      message: "Event not found",
    });
  }

  await Event.findByIdAndDelete(req.params.id);
  
  res.status(204).json({
    status: "success",
    data: null,
  });
});


exports.getAllEvents = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const filter = req.query.filter || '';

  const skip = (page - 1) * limit;
  // const sortOptions = {};
  // sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;

  const query = Event.find({
    eventName: { $regex: filter, $options: 'i' }, // Case-insensitive filter on the name field
  })
    .skip(skip)
    .limit(limit)
    .exec();

  await Promise.all([
    query,
    Event.countDocuments({
      eventName: { $regex: filter, $options: 'i' },
    })
  ])
    .then(([data, totalCount]) => {
      res.json(
        {
          data,
          page,
          limit,
          totalCount
        }
      );
    })
    .catch(err => {
      console.error('Error retrieving data:', err);
      res.status(500).json({ error: 'An error occurred' });
    });

});

exports.getEventById = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return res.status(404).json({
      status: "fail",
      message: "Event not found",
    });
  }
  res.status(200).json({
    status: "success",
    data: {
      event,
    },
  });
});
