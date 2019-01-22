function authMiddleware(req, res, next) {
	let parsedHeader;

	try {
		const authorizationHeader = (req.headers['x-api-auth']).toString().replace('bearer ', '');
		parsedHeader = (Buffer.from(authorizationHeader, 'base64').toString());	
	} catch(e) {
		console.log('ToDo: process invalid auth');
	}	

	if (!parsedHeader || parsedHeader.indexOf(':') <= 0) {
		res.status(401).send({
			status: 'error',
			error: 'Authentication Failed'
		});

		return;
	}

	next();
}

module.exports = authMiddleware;
