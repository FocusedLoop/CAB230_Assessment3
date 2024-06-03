// Import jsonwebtoken to generate tokens
const jwt = require('jsonwebtoken');

// Determine if they user is authorised from there token
// If they are not authorised or there is an issue with the token return an appropiate message
function authorisation(req, res, next) {
	// Check for the authorization header in the token
	if (!('authorization' in req.headers)) {
		res.status(401).json({
			error: true,
			message: "Authorization header ('Bearer token') not found",
		});
		return;
	}

	// Check if the token header is malformed
	if (!req.headers.authorization.match(/^Bearer /)) {
		res.status(401).json({
			error: true,
			message: "Authorization header is malformed",
		});
		return;
	}

	// Check if the token is valid token or is expired
	const token = req.headers.authorization.replace(/^Bearer /, '');
	try {
		// Decode the token and return the email from it email so the server knows which token associates with which user email
		const TokenDecoded = jwt.verify(token, process.env.JWT_SECRET);
		req.userEmail = TokenDecoded.email;
	} catch (e) {
		if (e.name === 'TokenExpiredError') {
			res.status(401).json({ error: true, message: 'JWT token has expired' });
		} else {
			res.status(401).json({ error: true, message: 'Invalid JWT token' });
		}
		return;
	}

	// Move to the next middleware
	next();
}

// Export authorisation so it can be used
module.exports = authorisation;
