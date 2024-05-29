var express = require('express');
var router = express.Router();

const authorisation = require("../middleware/authorisation");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/countries', function (req, res, next) {
    const allowedParams = ['sort'];
    const queryParams = Object.keys(req.query);
    
    const invalidParams = queryParams.filter(param => !allowedParams.includes(param));
    
    if (invalidParams.length > 0) {
        res.status(400).json({
            error: true,
            message: 'Invalid query parameters. Query parameters are not permitted.'
        });
    } else {
        const sort = req.query.sort || 'asc';
        req.db
            .from('data')
            .select('name', 'country')
            .orderBy('name', sort)
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

// NOTE: Added filter by population distance
router.get('/volcanoes', function (req, res, next) {
    const { country, sort = 'asc' } = req.query;

    if (!country) {
        res.status(400).json({
            error: true,
            message: 'Country is a required query parameter.'
        });
        return;
    }

    req.db
        .from('data')
        .select('country')
        .where('country', '=', country)
        .then((rows) => {
            if (rows.length === 0) {
                res.status(400).json({
                    error: true,
                    message: 'Country is a required query parameter.'
                });
            } else {
                req.db
                    .from('data')
                    .select('id', 'name', 'country', 'region', 'subregion')
                    .where('country', '=', country)
                    .orderBy('name', sort)
                    .then((rows) => {
                        res.json(rows);
                    })
                    .catch((err) => {
                        console.error(err);
                        res.status(500).json({ error: true, message: 'Error in MySQL query' });
                    });
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ error: true, message: 'Error in MySQL query' });
        });
});

router.get('/volcano/:id', function (req, res, next) {
	const allowedParams = ['sort'];
    const queryParams = Object.keys(req.query);
    
    const invalidParams = queryParams.filter(param => !allowedParams.includes(param));
    
    if (invalidParams.length > 0) {
        res.status(400).json({
            error: true,
            message: 'Invalid query parameters. Query parameters are not permitted.'
        });
    } else {
    	req.db
        	.from('data')
        	.select('*')
        	.where('id', '=', req.params.id)
        	.then((rows) => {
                // Check if the volcano id is valid
            	if (rows.length === 0) {
                	res.status(404).json({
                    	error: true,
                    	message: `Volcano with ID: ${req.params.id} not found.`
                	});
            	} else {
                    // Check if token is present
                    if (req.headers.authorization) {
                        authorisation(req, res, () => {res.json(rows[0])});
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

router.get('/me', function (req, res, next) {
	const me_data = {
        name: "Joshua Wlodarczyk",
        student_number: "n11275561"
    };

	res.json(me_data)
});

// REMOVE?
router.post('/update', authorisation, (req, response) => { 
	if (!req.body.data || !req.body.region || !req.body.population) {
		response.status(400).json({ message: `Error updating population` });
		console.log(`Error on request body:`, JSON.stringify(req.body));
	} else {
		const filter = {
			Name: req.body.data,
			Region: req.body.region,
		};
		const pop = {
			Population: req.body.population,
		};

		req.db('data')
			.where(filter)
			.update(pop)
			.then((_) => {
				response.status(201).json({ message: `Successful update ${req.body.data}` });
				console.log(`successful population update:`, JSON.stringify(req.body));  // server logging
			})
			.catch((error) => {
				console.error(`Error updating population:`, error.message);  // server logging
				response.status(500).json({ message: 'Database error - not updated' });
			});
	}
});

module.exports = router;