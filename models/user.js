const config = require('config');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const utilFunctions = require('../util/index');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: String,
    name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
        unique: true
    },
    iat: Number,
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 1024
    },
    urls: { type: Array, "default": [] }
});

userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({ userId: this.userId, iat: utilFunctions['getIat']() }, config.get('jwtPrivateKey'));
    return token;
}

const User = mongoose.model('User', userSchema);

function validateUser(user) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).required(),
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(5).max(255).required()
    });
    return schema.validate(user);
}

exports.User = User;
exports.validate = validateUser;