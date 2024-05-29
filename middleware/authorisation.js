const jwt = require('jsonwebtoken');

function authorisation(req, res, next) {
	if (!('authorization' in req.headers) || !req.headers.authorization.match(/^Bearer /)) {
		res.status(401).json({
			error: true,
			message: "Authorization header ('Bearer token') not found",
		});
		return;
	}
	const token = req.headers.authorization.replace(/^Bearer /, '');
	try {
		//jwt.verify(token, process.env.JWT_SECRET);
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

	next();
}

module.exports = authorisation;
