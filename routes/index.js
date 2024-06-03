// Import express and router to handle different routes for the server
// Use the router to handle different methods like GET, POST and PUT
var express = require('express');
var router = express.Router();

// Import middleware files
const authorisation = require("../middleware/authorisation");

// All listed endpoints mounted to /
// Send the user to the swagger docs
router.get('/', (req, res) => {
    res.redirect('/docs');
});

// Get a list of all the countries from the database
router.get('/countries', function (req, res, next) {

    // Handle and check for invalid qeury parameters
    const allowedParams = ['sort'];
    const queryParams = Object.keys(req.query);
    const invalidParams = queryParams.filter(param => !allowedParams.includes(param));
    
    // If there are no query parameters return and error else produce the list of countries
    if (invalidParams.length > 0) {
        
        res.status(400).json({
            error: true,
            message: 'Invalid query parameters. Query parameters are not permitted.'
        });
    } else {
        // Display all volcanoes for a queried country and sort the countries alphabetically, limit the amount by 76
        const sort = req.query.sort || 'asc';
        const limit = req.query.limit || 76;
        req.db
            .from('data')
            .distinct('country')
            .orderBy('country', sort)
            .limit(limit)
		    
            .then((rows) => {
                const countries = rows.map(row => row.country);
                res.json(countries);
            })
            .catch((err) => {
                console.log(err);
                res.status(500).json({ error: true, message: 'Error in MySQL query' });
            });
    }
});

// Get all the volcanoes in a desired country
// Allow the user to filter the volcano by population distance
router.get('/volcanoes', function (req, res, next) {

    // Handle and check for invalid qeury parameters
    const validParams = ['country', 'sort', 'populatedWithin'];
    const receivedParams = Object.keys(req.query);
    const invalidParams = receivedParams.filter(param => !validParams.includes(param));

    // If there are no invalid query parameters return and error else produce the list of volcanoes
    if (invalidParams.length > 0) {
        res.status(400).json({
            error: true,
            message: 'Invalid query parameters. Query parameters are not permitted.'
        });
        return;
    }

    // Check if there is a country query parameter so the server can select the volcanoes in the database with something
    const { country, sort = 'asc', populatedWithin } = req.query;
    if (!country) {
        res.status(400).json({
            error: true,
            message: 'Country is a required query parameter.'
        });
        return;
    }

    // Display all the volcaneos in the queried country
    req.db
        .from('data')
        .select('country')
        .where('country', '=', country)
        .then(() => {
            let query = req.db
                .from('data')
                .select('id', 'name', 'country', 'region', 'subregion')
                .where('country', '=', country);

            // Filter the list of volcanoes by population distance
            if (populatedWithin) {
                let populationColumn;
                    switch (populatedWithin) {
                        case '5km':
                            populationColumn = 'population_5km';
                            break;
                        case '10km':
                            populationColumn = 'population_10km';
                            break;
                        case '30km':
                            populationColumn = 'population_30km';
                            break;
                        case '100km':
                            populationColumn = 'population_100km';
                            break;
                        default:
                            res.status(400).json({
                                error: true,
                                message: 'Invalid value for populatedWithin. Only: 5km,10km,30km,100km are permitted.'
                            });
                        return;
                    }
                    query = query.where(populationColumn, '>', 0);
                }
                // Order the query by id and volcano name
                query
                    .orderBy([{ column: 'id', order: sort }, { column: 'name', order: sort }])
                    .then((rows) => {
                        res.json(rows);
                    })
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ error: true, message: 'Error in MySQL query' });
        });
});

// Display the details of a desired volcano queried by the id
router.get('/volcano/:id', function (req, res, next) {

    // Handle and check for invalid qeury parameters
	const allowedParams = ['sort'];
    const queryParams = Object.keys(req.query);
    const invalidParams = queryParams.filter(param => !allowedParams.includes(param));

    // If there are no query parameters return and error else produce the data for the desired volcano
    if (invalidParams.length > 0) {
        res.status(400).json({
            error: true,
            message: 'Invalid query parameters. Query parameters are not permitted.'
        });
    } else {
        // Display the volcano data
    	req.db
        	.from('data')
        	.select('*')
        	.where('id', '=', req.params.id)
        	.then((rows) => {
                // Check if the volcano id is a valid id from the volcano database
            	if (rows.length === 0) {
                	res.status(404).json({
                    	error: true,
                    	message: `Volcano with ID: ${req.params.id} not found.`
                	});
            	} else {
                    // Check if the user is authorised by checking if a token is present
                    // Display volcano data if the user is authorised
                    if (req.headers.authorization) {
                        // Check if the user is authorised
                        authorisation(req, res, () => {res.json(rows[0])});
                    // Display a limited form of the volcano data that doesnt display the population density if the user is unauthorised
                    } else {
                        const authorisationFilter = rows.map(row => {
                            const { population_5km, population_10km, population_30km, population_100km, ...rest } = row;
                            return rest;
                        });
                        res.json(authorisationFilter[0]);
                    }
            	}
        	})
        	.catch((err) => {
            	console.error(err);
            	res.status(500).json({ error: true, message: 'Error in MySQL query' });
        	});
	}
});

// Produce my student name and student number
router.get('/me', function (req, res, next) {
	const me_data = {
        name: "Joshua Wlodarczyk",
        student_number: "n11275561"
    };
	res.json(me_data)
});

// Export the routers so they can be used
module.exports = router;