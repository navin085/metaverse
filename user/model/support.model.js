const mongoose = require("mongoose");
const supportSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userQuery: [
    {
      message: { type: String },
      image: { type: String },
      reply: { type: String },
      date: {
        type: Date,
        default: new Date(),
      },
    },
  ],
  status: {
    type: String,
    enum: ["Open", "Closed"],
    default: "Open",
  },
  createdAt: {
    type: Number,
    default: Date.now(),
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

const Support = mongoose.model("support", supportSchema);

module.exports = Support;

// const mongoose = require("mongoose");
// const supportSchema = new mongoose.Schema({
//      userId: { type: String, required: true},
//      userQuery:[{
//       message: {type: String, required: true},
//       image:{ type: String},
//       date: {
//         type: Date,
//         default: new Date(),
//       }
//      }],

//      adminReplies:[{
//       reply:{ type: String},
//       date: {
//         type: Date,
//         default: new Date(),
//       }
//      }],
//      status: {
//       type: String,
//       enum: ["Open", "Closed"],
//       default: "Open",
//     },
//       createdAt: {
//         type: Number,
//         default: Date.now(),
//       },
//       date: {
//         type: Date,
//         default: new Date(),
//       }
// });

// const Support = mongoose.model('support', supportSchema);

// module.exports = Support;
