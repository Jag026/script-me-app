const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const { sessionSecret } = require('./config');
const { restoreUser } = require('./auth');
const indexRoutes = require('./routes/index');
const partRoutes = require('./routes/part');
const scriptRoutes = require('./routes/script');
const userRoutes = require('./routes/user');
const responseRoutes = require('./routes/response');

const app = express();

app.set('view engine', 'pug');
app.use(morgan('dev'));
app.use(cookieParser(sessionSecret));
app.use(session({
    name: 'script-me.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
}));

app.use(express.urlencoded({ extended: false }));
app.use(restoreUser);
app.use('/', indexRoutes)
app.use('/part', partRoutes)
app.use('/script', scriptRoutes)
app.use('/response', responseRoutes)
app.use('/user', userRoutes)
app.use(express.static(path.join(__dirname)));
app.use("/styles", express.static(__dirname + '/styles'));

app.use((req, res, next) => {
    const err = new Error('The requested page couldn\'t be found.');
    err.status = 404;
    next(err);
});

// Custom error handlers.

// Error handler to log errors.
app.use((err, req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        // TODO Log the error to the database.
    } else {
        console.error(err);
    }
    next(err);
});

// Error handler for 404 errors.
app.use((err, req, res, next) => {
    if (err.status === 404) {
        res.status(404);
        res.render('page-not-found', {
            title: 'Page Not Found',
        });
    } else {
        next(err);
    }
});

// Generic error handler.
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    const isProduction = process.env.NODE_ENV === 'production';
    res.render('error', {
        title: 'Server Error',
        message: isProduction ? null : err.message,
        stack: isProduction ? null : err.stack,
    });
});

module.exports = app;