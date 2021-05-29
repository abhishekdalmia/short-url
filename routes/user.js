const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const {User, validate} = require('../models/user');
const {Url} = require('../models/url');
const utilFunctions = require('../util/index');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

router.get('/', auth, async function(req, res) {
    const user = await User.findOne({ userId: req.user['userId'] }).select('-password');
    if ('userId' in req.user) {
        return res.status(200).send(`All urls created by the current user: ${JSON.stringify(user['urls'])}`);
    }
    else {
        return res.status(200).send('Do a "POST /auth/" request to login and see all customUrls created by you.');
    }
});

router.post('/', async function(req, res) {
    // validating req.body to contain right info for creating a new user
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // checking db if user already exists
    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send('User already registered.');

    // creating new user
    user = new User(_.pick(req.body, ['name', 'email', 'password']));

    // generate a unique id for the user
    let userId = user['_id'].toString().slice(-6);
    while(await User.findOne({ userId: userId })) {
        // the current date is added to create randomness
        userId += utilFunctions['getIat']().toString();
        userId = md5(userId).slice(-6);
    }
    user['userId'] = userId;

    // storing hashed password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    // setting the iat property
    user['iat'] = utilFunctions['getIat']();

    await user.save();

    // generating jwt and sending relevant information to the user
    const token = user.generateAuthToken();
    res.header('x-auth-token', token).send(_.pick(user, ['userId', 'name', 'email']));
});

router.put('/', auth, async function(req, res) {
    // auth ensured that the requesting user is logged in.
    // expect req.body to have: {oldPassword, newPassword}

    // check if valid jwt was provided
    if (!('userId' in req.user)) {
        return res.status(400).send('Invalid jwt. Obtain a new jwt using PUT /auth/');
    }
    let user = await User.findOne({ userId: req.user['userId'] });

    // no need to check if user exists in the database or not, because that was already done by the auth middleware

    // checking if 'oldPassword' provided is valid or not
    if (!('oldPassword' in req.body)) {
        return res.status(400).send('"oldPassword" field not provided.');
    }
    const validPassword = await bcrypt.compare(req.body.oldPassword, user.password);
    if (!validPassword) return res.status(400).send('Invalid password.');

    // utilizing the ../models/user.js validate function to check for constraint checks on the 'newPassword' property
    const { error } = validate({ 'name': user['name'], 'email': user['email'], 'password': req.body['newPassword'] });
    if (error) return res.status(400).send(error.details[0].message);

    // storing hashed password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body['newPassword'], salt);

    // assigning 'iat' property to the user object
    user['iat'] = utilFunctions['getIat']();

    await user.save();

    // sending newly generated auth token and other relevant information back to the user
    const token = user.generateAuthToken();
    res.header('x-auth-token', token).send(Object.assign({}, _.pick(user, ['userId', 'name', 'email']), {reqStatus: true, message: 'Password changed successfully.'}));
});

router.delete('/', auth, async function(req, res) {
    let user;
    if ('userId' in req.user) {
        // verified user, can delete it. But first require password as a double check
        if (!('password' in req.body)) {
            return res.status(400).send('Password not provided. Provide password for double checking.');
        }
        // verify if the password provided is valid or not
        user = await User.findOne({ userId: req.user['userId'] });
        if (!user) {
            console.log('This should not have happened, as prescence of requested user(to be deleted) in db was already checked in the auth middleware.');
            return res.status(400).send('Deadly error encountered. lol');
        }
        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) return res.status(400).send('Invalid password.');
        // password verified, safe to delete the user
        // before deleting user, delete all urls created by the current user
        for (let index = 0; index < user['urls'].length; index++) {
            await Url.deleteOne({ shortUrl: user['urls'][index] });
        }
        user = await User.deleteOne({ userId: req.user['userId'] });
        if (user['deletedCount'] == 1) {
            return res.status(200).send(`Deleted ${req.user['userId']}`);
        }
        else {
            return res.status(500).send('Deadly error encountered. lol');
        }
    }
    else {
        // jwt not verified.
        return res.status(400).send('Invalid jwt. Obtain a new jwt using PUT /auth/');
    }
});

module.exports = router;
