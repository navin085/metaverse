const multer = require("multer");
const sharp = require("sharp");
const Support = require("../model/support.model");
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
  req.file.filename = `ticket-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

// exports.ticketRise = catchAsync(async (req, res, next) => {
// try{

//   // Check if a ticket with the same user and status "Open" already exists
//   const existingTicket = await Support.findOne({
//     userId: req.user.id,
//     status: "Open",
//   });

//   if (existingTicket) {
//     return next(new AppError("A ticket is already open for this user.", 404));
//   }

//   const supportTicket = new Support({
//     userId:req.user.id,
//     userQuery:[{
//       message:req.body.message,
//       image: req.file ? req.file.filename : "",
//     }]

//   });
//   // Save the support ticket to the database
//   await supportTicket.save();

//   res.status(201).json({
//     status: "success",
//     data: 
//       supportTicket,

//   });
// }catch(error) {
//   console.error("Error saving event:", error.message);
// };

// });

exports.ticketRise = catchAsync(async (req, res, next) => {
  try {
    // Find the user's open ticket
    const existingTicket = await Support.findOne({
      userId: req.user.id,
      status: "Open",
    });

    if (existingTicket) {
      // If an open ticket exists, add the new message to the existing ticket
      existingTicket.userQuery.push({
        message: req.body.message,
        image: req.file ? req.file.filename : "",
      });

      // Save the updated ticket to the database
      await existingTicket.save();

      return res.status(200).json({
        status: "success",
        data: existingTicket,
      });
    } else {
      // If no open ticket exists, create a new one
      const supportTicket = new Support({
        userId: req.user.id,
        userQuery: [
          {
            message: req.body.message,
            image: req.file ? req.file.filename : "",
          },
        ],
      });

      // Save the new support ticket to the database
      await supportTicket.save();

      return res.status(201).json({
        status: "success",
        data: supportTicket,
      });
    }
  } catch (error) {
    console.error("Error saving event:", error.message);
    next(error);
  }
});


exports.addQuestion = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { message } = req.body;

  try {
    // Find the support ticket by ID
    const supportTicket = await Support.findById(id);

    if (!supportTicket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    // Check if the status is "Open"
    if (supportTicket.status !== 'Open') {
      return res.status(400).json({ message: 'Support ticket is not open for replies' });
    }

    // Create the new question object
    const newQuestion = {
      message,
      image: req.file ? req.file.filename : '',
    };

    // Push the new question to the userQuery array
    supportTicket.userQuery.push(newQuestion);

    // Save the updated support ticket to the database
    const updatedSupportTicket = await supportTicket.save();

    res.status(200).json({ status: 'success', data: updatedSupportTicket });
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ message: 'Failed to add question' });
  }
});


exports.replyTicket = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { reply } = req.body;

    // Find the support ticket by ID and validate its status
    const supportTicket = await Support.findOneAndUpdate(
      { _id: id, status: 'Open' },
      { $push: { 'userQuery': { reply:reply } } },
      { new: true }
    );

    if (!supportTicket) {
      return res.status(404).json({ message: 'Support ticket not found or not open for replies' });
    }

    res.status(200).json({ status: 'success', data: supportTicket });
 
});


// exports.updateStatus = catchAsync(async (req, res, next) => {
//   const { id } = req.params;
//   const { status } = req.body;

//     // Validate the status field
//     if (!status || (status !== 'Open' && status !== 'Closed')) {
//       return res.status(400).json({ message: 'Invalid status value' });
//     }

//     // Find the support ticket by ID
//     const supportTicket = await Support.findById(id);

//     if (!supportTicket) {
//       return res.status(404).json({ message: 'Support ticket not found' });
//     }

//     // Check if the status is "Open"
//     if (supportTicket.status === 'Closed') {
//       return res.status(400).json({ message: 'Support ticket already closed' });
//     }

//     // Update the status field in the support ticket document
//     supportTicket.status = status;
//     await supportTicket.save();

//     res.status(200).json({ status: 'success', data: supportTicket });
  
// });


exports.updateStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id; // Assuming you want to check if the user owns the ticket

  // Validate the status field
  if (!status || (status !== 'Open' && status !== 'Closed')) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    // Find the support ticket by ID and user ID
    const supportTicket = await Support.findOne({ _id: id, userId });

    if (!supportTicket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    // Check if the status is "Open"
    if (supportTicket.status === 'Closed' && status === 'Open') {
      return res.status(400).json({ message: 'Support ticket already closed' });
    }

    // Update the status field in the support ticket document
    supportTicket.status = status;
    await supportTicket.save();

    res.status(200).json({ status: 'success', data: supportTicket });
  } catch (error) {
    console.error('Error updating support ticket status:', error.message);
    next(error);
  }
});


exports.deleteTicket = catchAsync(async (req, res, next) => {
  const ticket = await Support.findById(req.params.id);

  if (!ticket) {
    return next(new AppError("Ticket not found.", 404));
  }

  await Support.findByIdAndDelete(req.params.id);

  return res.status(204).json({
    status: "success",
    message: "Support ticket deleted successfully",
  });
  
});

exports.getAllTicket = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const filter = req.query.filter || "";

  const skip = (page - 1) * limit;
  // const sortOptions = {};
  // sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;

  const query = Support.find({
    status: { $regex: filter, $options: "i" }, // Case-insensitive filter on the name field
  })
    .skip(skip)
    .limit(limit)
    .exec();

  await Promise.all([
    query,
    Support.countDocuments({
      userId: { $regex: filter, $options: "i" },
    }),
  ])
    .then(([data, totalCount]) => {
      res.json({
        data,
        page,
        limit,
        totalCount,
      });
    })
    .catch((err) => {
      console.error("Error retrieving data:", err);
      res.status(500).json({ error: "An error occurred" });
    });
});

exports.getTicketById = catchAsync(async (req, res, next) => {
  const support = await Support.findById(req.params.id);
  if (!support) {
    return next(new AppError("Data not found.", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      support,
    },
  });
});

exports.getSingleUsersAllTickets = catchAsync(async (req, res, next) => {
  const userId = req.user.id; // Assuming req.user.id contains the user's ID

  const userTickets = await Support.find({ userId });

  if (!userTickets || userTickets.length === 0) {
    return res.status(404).json({
      status: "fail",
      message: "No tickets found for this user.",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      userTickets,
    },
  });
});
