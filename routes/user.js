const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const {User, validate} = require('../models/user');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// the get method would require authentication feature
// router.get('/me', auth, async function(req, res) {
//   const user = await User.findById(req.user._id).select('-password');
//   res.send(user);
// });

router.post('/', async function(req, res) {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send('User already registered.');

    user = new User(_.pick(req.body, ['name', 'email', 'password']));

    // generate a unique id for the user
    let userId = user['_id'].toString().slice(-6);
    while(await User.findOne({ userId: userId })) {
        // the current date is added to create randomness
        userId += Date.now().toString();
        userId = md5(userId).slice(-6);
    }
    user['userId'] = userId;

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();

    const token = user.generateAuthToken();
    res.header('x-auth-token', token).send(_.pick(user, ['_id', 'name', 'email']));
});

router.delete('/', auth, async function(req, res) {
    if ('userId' in req.user) {
        // verified user, can delete it
        let user = await User.deleteOne({ userId: req.user['userId'] });
        if (user['deletedCount'] == 1) {
            res.status(200).send(`Deleted ${req.user['userId']}`);
        }
        else {
            res.status(500).send('Dunno what went wrogn.');
        }
    }
    else {
        // un-verified user, cannot delete it
        res.status(400).send('You need to be logged in to delete your account.');
    }
});

module.exports = router;
