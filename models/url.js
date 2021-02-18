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
    userId: String,
    creationDate: { type: Date, default: Date.now() },
    expirationDate: { type: Date, default: Date.now() }
});

const Url = mongoose.model('url', urlSchema);

function validateUrl(url) {
    let pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    const schema = Joi.object({
        longUrl: Joi.string().pattern(pattern).required(),
        customName: Joi.string()
    });
    return schema.validate(url);
}

exports.urlSchema = urlSchema;
exports.Url = Url;
exports.validate = validateUrl;