const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/', function (req, res, next) {
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

  // I CHANGE TABLE NAME "users" to "user" !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // was originally user changed to users - message from josh
	const queryUser = req.db.from('users').select('*').where('email', '=', email);
	queryUser
		.then((users) => {
			if (users.length === 0) {
				throw new Error('User does not exist');
			}

			// Compare password hashes
			const user = users[0];
			return bcrypt.compare(password, user.hash);
		})
		.then((match) => {
			if (!match) {
				throw new Error('Passwords do not match');
			}

			const expires_in = 60 * 60 * 24;
			const exp = Math.floor(Date.now() / 1000) + expires_in;
			const token = jwt.sign({ email, exp }, JWT_SECRET);

			res.status(200).json({
				token,
				token_type: 'Bearer',
				expires_in,
			});
		});
});

module.exports = router;
