// Importing knex into the database
// Importing modules
// Setting up knex configurations
const configurations = require('./knexfile.js');
const knex = require('knex')(configurations);
const cors = require('cors');

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// Importing routing files
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const app = express();

// Getting the swagger documents
const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');

// Setting up the engine for the server
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Server logger that logs any errors or issues encountered when running
app.use(logger('combined'));

app.use((req, res, next) => {
	req.db = knex;
	next();
});

// Middleware to help request items before the routes are setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('common'));
app.use(cors());

// Routes the server mounts other routes off
app.use('/', indexRouter);
app.use('/user', usersRouter);
// Produces the swagger docs for the user
app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// Invalid Routes to prevent a server error from occuring
app.use((req, res, next) => {
	res.status(404).json({ error: true, message: '404 Not Found' });
});

// Use the error handler to catch the 404 error
app.use(function (req, res, next) {
	next(createError(404));
});

// Error handler to process any recieved errors
app.use(function (err, req, res, next) {
	// Produce the error and error message
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// Render the error
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
