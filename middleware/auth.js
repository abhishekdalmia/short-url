const jwt = require('jsonwebtoken');
const config = require('config');
const {User} = require('../models/user');

module.exports = function (req, res, next) {
    // 1. decode to get the jwt payload
    // 2. check if the userId mentioned in the payload corresponds to an existing user in the database
    // 3. if requested userId user exists, make req.user = {'userId': decoded['userId']}
    // So if ('userId' in req.user) at the end of this middleware, implies a valid token corresponding to an entry in the db was provided
    const token = req.header('x-auth-token');
    req.user = {};
    try {
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        if ('iat' in decoded) {
            // check the iat in the decoded with iat in database to confirm if the jwt has expired or not
            User.findOne({ userId: decoded['userId'] })
                .then(user => {
                    if (user != null) {
                        if (decoded['iat'] >= user['iat']) {
                            req.user = decoded;
                        }
                    }
                    next();
                })
                .catch(() => next());
        }
        else {
            next();
        }

    }
    catch (ex) {
        next();
    }
}