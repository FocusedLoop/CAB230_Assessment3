function validateProfile(req, res, next) {
  const userData = req.body;

  const requiredFields = ['firstName', 'lastName', 'dob', 'address'];
  const missingFields = requiredFields.filter(field => !(field in userData));

  if (missingFields.length > 0) {
      return res.status(400).json({
          error: true,
          messgae: "Request body incomplete: firstName, lastName, dob and address are required."
          //message: `Missing required fields: ${missingFields.join(', ')}`
      });
  }

  if (typeof userData.firstName !== 'string' || typeof userData.lastName !== 'string' || typeof userData.address !== 'string') {
      return res.status(400).json({
          error: true,
          //message: 'firstName, lastName, and address must be strings'
          message: "Request body incomplete: firstName, lastName, dob and address are required."
      });
  }

  const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dobRegex.test(userData.dob)) {
      return res.status(400).json({
          error: true,
          //message: 'Invalid date of birth format. Please use YYYY-MM-DD'
          message: "Request body incomplete: firstName, lastName, dob and address are required."
      });
  }

  const dobDate = new Date(userData.dob);
  const currentDate = new Date();
  if (dobDate >= currentDate) {
      return res.status(400).json({
          error: true,
          //message: 'Date of birth must be in the past'
          message: "Request body incomplete: firstName, lastName, dob and address are required."
      });
  }

  // Move to the next middleware
  next();
}

module.exports = validateProfile;