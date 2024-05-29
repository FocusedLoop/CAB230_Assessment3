const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const validateProfile = require("../middleware/validateProfile");
const authorisation = require("../middleware/authorisation");

require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

// NOTE: Create table?
router.post('/register', function (req, res, next) {
	// Retrieve email and password from req.body
	const email = req.body.email;
	const password = req.body.password;

	// Verify body
	if (!email || !password) {
		res.status(400).json({
			error: true,
			message: 'Request body incomplete, both email and password are required',
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
			res.status(201).json({ message: 'User created' });
		})
		.catch((e) => {
			res.status(409).json({ error: true, message: e.message });
		});
});

router.post('/login', function (req, res, next) {
  const email = req.body.email;
  const password = req.body.password;

  // Verify body
  if (!email || !password) {
      res.status(400).json({
          error: true,
          message: 'Request body incomplete, both email and password are required',
      });
      return;
  }

  // I CHANGE TABLE NAME "users" to "user" !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // was originally user changed to users - message from josh
  const queryUser = req.db.from('users').select('*').where('email', '=', email);

  queryUser
      .then((users) => {
          if (users.length === 0) {
              throw new Error('Incorrect email or password');
          } else {
              // Comparing the password hash with the database
              const user = users[0];
              return bcrypt.compare(password, user.hash);
          }
      })
      .then((match) => {
          if (!match) {
              throw new Error('Incorrect email or password');
          }

          const expires_in = 60 * 60 * 24;
          const exp = Math.floor(Date.now() / 1000) + expires_in;
          const token = jwt.sign({ email, exp }, JWT_SECRET);

          res.status(200).json({
              token,
              token_type: 'Bearer',
              expires_in,
          });
      })
      .catch((e) => {
          res.status(401).json({ error: true, message: e.message });
      });
});

// Add scheme error handling fix error handling
const profiles = {};
router.route('/:email/profile')
  .post(authorisation, validateProfile, function (req, res, next) {

    const { email } = req.params;
    const { firstName, lastName, dob, address } = req.body;
    profiles[email] = { firstName, lastName, dob, address };

    if (email !== req.userEmail) {
        return res.status(403).json({ error: true, message: "Forbidden" });
    }

    res.json({
        email, firstName, lastName, dob, address
      });
  })

  .get((req, res, next) => {
    const { email } = req.params;

    const profile = profiles[email];
    if (!profile) {
        return res.status(404).json({ error: true, message: 'User not found' });
    }

    if (req.headers.authorization) {
        authorisation(req, res, next);
    } else {
        next();
    }
    if (req.userEmail) {
        res.json({
            email: req.params.email,
            ...profiles[req.params.email]
        });
    } else {
        const { dob, address, ...limitedProfile } = profile;
        res.json({
            email: req.params.email,
            ...limitedProfile
        });
    }
});

module.exports = router;
