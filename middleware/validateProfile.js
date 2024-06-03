// Validate the profile query data
function validateProfile(req, res, next) {

    // Handle and check for invalid qeury parameters
    const userData = req.body;
    const requiredFields = ['firstName', 'lastName', 'dob', 'address'];
    const missingFields = requiredFields.filter(field => !(field in userData));

    // Check for invalid body format
    if (missingFields.length > 0) {
        return res.status(400).json({
            error: true,
            messgae: "Request body incomplete: firstName, lastName, dob and address are required."
        });
    }

    // Check for Invalid FirstName, LastName and Address
    if (typeof userData.firstName !== 'string' || typeof userData.lastName !== 'string' || typeof userData.dob !== 'string' || typeof userData.address !== 'string') {
    return res.status(400).json({
        error: true,
        message: "Request body incomplete: firstName, lastName, dob and address are required."
    });
    }

    // Check if the fields are empty or null
    if (!userData.firstName || !userData.lastName || !userData.dob || !userData.address) {
    return res.status(400).json({
        error: true,
        message: "Request body incomplete: firstName, lastName, dob, and address are required."
    });
    }

    // Check for Invalid date format
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(userData.dob)) {
        return res.status(400).json({
            error: true,
            message: "Invalid input: dob must be a real date in format YYYY-MM-DD."
        });
    }

    // Check for Invalid Profile Date
    const dobDate = new Date(userData.dob);
    const currentDate = new Date();
    if (dobDate >= currentDate) {
        return res.status(400).json({
            error: true,
            message: "Invalid input: dob must be a date in the past."
        });
    }

    // Move to the next middleware
    next();
}

// Export validateProfile so it can be used
module.exports = validateProfile;