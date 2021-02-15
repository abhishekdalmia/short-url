const Joi = require('joi');
const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    longUrl: String,
    shortUrl: String,
    hitRate: {
        type: [
            {
                "date": {
                    type: String
                },
                "hits": {
                    type: Number
                }
            }
        ]
    },
    isCustom: String,
    creationDate: { type: Date, default: Date.now() },
    expirationDate: { type: Date, default: Date.now() }
});

const Url = mongoose.model('url', urlSchema);

function validateUrl(url) {
    const schema = {
        shortUrl: Joi.string()
    };
    return Joi.validate(url, schema);
}

exports.urlSchema = urlSchema;
exports.Url = Url;
exports.validate = validateUrl;