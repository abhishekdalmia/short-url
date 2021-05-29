const express = require('express');
const { model } = require('mongoose');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, function(req, res) {
    if ('userId' in req.user) {
        return res.send(`Request from a valid user ${req.user.userId}`)
    }
    else {
        return res.send(`Request from an invalid user`);
    }
});

module.exports = router;