const path = require('path');
const fs = require('fs')
const express = require('express');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
const requestIp = require('request-ip');
const AppError = require('./utills/appError');
const GlobalError = require('./utills/errorController');
// Routes
const AdminRoutes = require("./admin/router/mainRouter");
const UserRoutes = require("./user/router/main.router");

// Start express app
const app = express();

app.enable('trust proxy');


// 1) GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors());

app.options('*', cors());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
// app.use("/api/images", express.static(path.join("images")));

app.use(requestIp.mw());

// Route to retrieve the user's resized photo
app.get('/api/users/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'public', 'img', 'users', filename);
    res.sendFile(filePath);
  });

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}


// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

app.use(compression());

// Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.cookies);
    next();
});


// 3) ROUTES
app.use('/api/v1/metaverse', 
AdminRoutes,
UserRoutes
);


app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(GlobalError);

module.exports = app;