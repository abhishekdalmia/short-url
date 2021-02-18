const express = require('express');
const { model } = require('mongoose');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, function(req, res) {
    if ('userId' in req.user) {
        console.log(`Request from a valid user ${req.user.userId}`)
    }
    else {
        console.log("Request from non-verified user");
    }
    res.send("Home Page.");
});

module.exports = router;