// Import express and router to handle different routes for the server
// Use the router to handle different methods like GET, POST and PUT
// Import bcrypt to allow for password hashing
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Import middleware files
const validateProfile = require("../middleware/validateProfile");
const authorisation = require("../middleware/authorisation");

// Handles the token by verifying it using a set secret key to ensure its secure
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

// Creates a new user in the users table in the database
router.post('/register', function (req, res, next) {
	// Retrieve email and password from req.body in form
	const email = req.body.email;
	const password = req.body.password;

	// Verify that an email and password is present in the form body
	if (!email || !password) {
		res.status(400).json({
			error: true,
			message: 'Request body incomplete, both email and password are required',
		});
		return;
	}

  // Check if the user is already a registered user in the table
	const queryUsers = req.db.from('users').select('*').where('email', '=', email);
	queryUsers
		.then((users) => {
			if (users.length > 0) {
				throw new Error('User already exists');
			}

			// Insert the desired user into the database
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

// Gives authorisation to the user if they log in correctly
// If the user submits the correct email and password give the user authorisation
router.post('/login', function (req, res, next) {
  // Retrieve email and password from req.body in form
  const email = req.body.email;
  const password = req.body.password;

  // Verify that an email and password is present in the form body
  if (!email || !password) {
      res.status(400).json({
          error: true,
          message: 'Request body incomplete, both email and password are required',
      });
      return;
  }

  // For the email used to login with in the form check if the password is correct
  const queryUser = req.db.from('users').select('*').where('email', '=', email);
  queryUser
      // Check if the password in the form is correct
      .then((users) => {
          if (users.length === 0) {
              throw new Error('Incorrect email or password');
          } else {
              // Comparing the password hash with the database
              const user = users[0];
              return bcrypt.compare(password, user.hash);
          }
      })
      // Check if the email exists in the database
      .then((match) => {
          if (!match) {
              throw new Error('Incorrect email or password');
          }

          // If the email exists in the database and the password matches the hashed password create a new token
          // Set the token to expire in 24 hours
          const expires_in = 60 * 60 * 24;
          const exp = Math.floor(Date.now() / 1000) + expires_in;
          const token = jwt.sign({ email, exp }, JWT_SECRET);

          // Display the token
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

// Display and upload profile data for users in the database
router.route('/:email/profile')
// Upload profile data to the database
// Check that the user is authorised and check if the profile data in the query is valid
.put(authorisation, validateProfile, function (req, res, next) {
  // Retrieve email and profile data from req.body in form
  const { email } = req.params;
  const { firstName, lastName, dob, address } = req.body;

  // If the user is not the same user as the profile they are uploading data to return an error
  if (email !== req.userEmail) {
      return res.status(403).json({ error: true, message: "Forbidden" });
  }

  // Upload the profile data to the respected fields in the same row as users email
  const userData = {
      email,
      firstName,
      lastName,
      dob,
      address
  };

  req.db.from("users").where("email", "=", email)
    // If fields are empty insert the profile data into the database otherwise update the fields with the new data
    .then(users => {
        if (users.length > 0) {
            return req.db.from("users").where("email", "=", email).update(userData);
        } else {
            return req.db.from("users").insert(userData);
        }
    })
    // Display the uploaded profile data
    .then(() => {
        res.json(userData);
    })
    .catch(error => {
        console.error(error);
        res.status(500).json({ error: true, message: "Failed to save profile data" });
    });
})
// Retrieve the profile data from the users database
.get((req, res, next) => {
  // Retrieve email from req.body in form
  const { email } = req.params;

  // Grab data in the database from users that share the same email in the form
  req.db.from("users").select("*").where("email", "=", email)
    .then(users => {
      // Check if the user is in the users table in the database
      if (users.length === 0) {
          return res.status(404).json({ error: true, message: 'User not found' });
      }

      // Check if the current user is authorised to view the full profile data or limited profile data
      const user = users[0];
      if (req.headers.authorization) {
          authorisation(req, res, next);
      } else {
          next();
      }

      // Check if the current signed in user (authorised user) is the same user as the profile they desire to request data from
      // If they are the same user show them the full data otherwise show them limited data
      if (req.userEmail && req.userEmail === email) {
        // Display all profile data
        const { id, hash, ...authorisedUser } = user;
          res.json({
              email,
              ...authorisedUser
          });
      } else {
        // Display all profile data expect for the date of birth and address (limited data)
        const { id, dob, address, hash, ...limitedUser } = user;
        res.json({
            email,
            ...limitedUser
        });
      }
    })
    .catch(error => {
        console.error(error);
    });
});

// Export the routers so they can be used
module.exports = router;
