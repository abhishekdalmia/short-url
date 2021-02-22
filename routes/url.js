const config = require('config');
const path = require('path');
const {Url, validate} = require('../models/url');
const { response } = require('express');
const express = require('express');
const router = express.Router();
// custom middlewares:
const auth = require('../middleware/auth');
// util functions:
const utilFunctions = require('../util/index');

// website related config values
const websiteUrl = config.get('Website.url');
const port = config.get('Website.port');

router.get('/', function(req, res) {
    res.send('This api has no job right now.');
    // res.sendFile(path.join(__dirname, '../public/home/', 'index.html'));
});

router.get('/:shortUrl', async function(req, res) {
    // redirect to respective full url if valid, else send 404 not found
    shortUrl = req.params.shortUrl;
    let url = await Url
    .findOne({
        shortUrl: shortUrl
    });
    if (url) {
        // update the redirect count for this url for current day
        let currDate = utilFunctions['getDate']();
        let tempInd = url['hitRate'].findIndex(x => x.date == currDate);
        if (tempInd === -1) {
            // currDate was not already in the db
            url['hitRate'].push({ 'date': currDate, 'hits': 1 });
        }
        else {
            url['hitRate'][tempInd]['hits'] += 1;
        }
        await url.save();
        res.redirect(url['longUrl']);
    }
    else {
        res.status(404).send('Requested short-url not found in the database.');
        // res.sendFile('./public/404/index.html', { root: __dirname });
    }
});

router.post('/', auth, async function(req, res) {
    const { error } = validate(req.body);
    // Joi returning error while validating means that the given longUrl is not a valid URL
    if (error) return res.status(400).send("The given longUrl is not a valid URL.");
    let longUrl = req.body['longUrl'];
    let url;
    let newUrlCreated = false;
    let customNameRequested = false;
    if ('customName' in req.body) {
        customNameRequested = true;
    }
    if (customNameRequested === true) {
        // custom name requested
        let customName = req.body['customName'];
        url = await Url
        .findOne({
            shortUrl: customName
        });
        if (url) {
            // url with that customName already exists
            return res.send({ reqStatus: false, message: 'The name ' + customName + ' is not available.', shortUrl: null });
        }
        else {
            newUrlCreated = true;
            // create a new shortUrl entry in the database
            url = new Url({
                longUrl: longUrl,
                shortUrl: customName,
                isCustom: true,
                creationDate: Date.now()
            });
        }
    }
    else {
        // random shortUrl requested
        url = await Url
        .findOne({
            longUrl: longUrl,
            isCustom: false
        });
        if (!url) {
            // url with that longUrl has to be created
            newUrlCreated = true;
            url = new Url({
                longUrl: longUrl,
                isCustom: false,
                creationDate: Date.now()
            });
            let hash = url['_id'].toString().slice(-6);
            while(await Url.findOne({ shortUrl: hash })) {
                // the current date is added to create randomness
                hash += Date.now().toString();
                hash = md5(hash).slice(-6);
            }
            url['shortUrl'] = hash;
        }
    }
    if ('userId' in req.user && newUrlCreated === true) {
        // current short Url newly created by the current user
        url['userId'] = req.user['userId'];
    }
    else if (!('userId' in req.user) && newUrlCreated === true) {
        // new url created, but no verified user jwt provided
        url['userId'] = null;
    }
    await url.save();
    if (newUrlCreated === true && customNameRequested === true) {
        message = 'New custom short url created.';
    }
    else if (newUrlCreated === true && customNameRequested === false) {
        message = 'New random short url created.';
    }
    else {
        // newUrlCreated === false && customNameRequested === false
        message = 'Short url for given long url already existed in the database.';
    }
    res.send({ reqStatus: true, message: message, shortUrl: websiteUrl + ':' + port.toString() + '/url/' + url['shortUrl'] });
});

router.delete('/', auth, async function(req, res) {
    if ('userId' in req.user && 'shortUrl' in req.body) {
        // verified user, shortUrl present in the body, delete the shortUrl mentioned in the body if it exists in the database
        let url = await Url.deleteOne({ userId: req.user['userId'], shortUrl: req.body['shortUrl'] });
        if (url['deletedCount'] == 1) {
            res.status(200).send(`Deleted ${req.body['shortUrl']}`);
        }
        else {
            res.status(400).send('Bad request. (either the url is not present in the database, or the user did not create it)');
        }
    }
    else if ('userId' in req.user && !('shortUrl' in req.body)) {
        // verified user, shortUrl not present in the body
        res.status(400).send('No short url provided.');
    }
    else {
        // un-verified user
        res.status(400).send('You need to be logged in to delete a URL (and that URL has to be created by you).');
    }
});

module.exports = router;