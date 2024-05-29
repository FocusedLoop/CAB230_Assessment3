// import knex to use, knex helps us talk to the database
const configurations = require('./knexfile.js');
const knex = require('knex')(configurations);
const cors = require('cors');

const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');


const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
//const knexRouter = require('./routes/knex'); 
//const loginRouter = require('./routes/login');
//const registerRouter = require('./routes/register');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument))

// Do a quick google to know WHY we need to log in the server 
// AND it is included in the CRA
app.use(logger('combined'));

app.use((req, res, next) => {
	req.db = knex;
	next();
});


// We call this middleware. They are like plugins that help us do something to the request before the request reaches the route
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('common'));
app.use(cors());

app.use('/', indexRouter);
app.use('/user', usersRouter);
//app.use('/me', apiRouter);




// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
