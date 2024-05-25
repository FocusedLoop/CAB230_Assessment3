const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

router.post('/', function (req, res, next) {
	// Retrieve email and password from req.body
	const email = req.body.email;
	const password = req.body.password;

	// Verify body
	if (!email || !password) {
		res.status(400).json({
			error: true,
			message: 'Request body incomplete - email and password needed',
		});
		return;
	}

	// Determine if user already exists in table
  // I CHANGE TABLE NAME "users" to "user" !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // was originally user changed to users - message from josh
	const queryUsers = req.db.from('users').select('*').where('email', '=', email);
	queryUsers
		.then((users) => {
			if (users.length > 0) {
				throw new Error('User already exists');
			}

			// Insert user into DB
			const saltRounds = 10;
			const hash = bcrypt.hashSync(password, saltRounds);
			return req.db.from('users').insert({ email, hash });
		})
		.then(() => {
			res.status(201).json({ success: true, message: 'User created' });
		})
		.catch((e) => {
			res.status(500).json({ success: false, message: e.message });
		});
});

module.exports = router;
