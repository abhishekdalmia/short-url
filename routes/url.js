const config = require('config');
const path = require('path');
const {Url, validate} = require('../models/url');
const { response } = require('express');
const express = require('express');
const router = express.Router();

// website related config values
const websiteUrl = config.get('Website.url');
const port = config.get('Website.port');

// getDate reuturns current date in yyyymmdd format
function getDate() {
    let today = new Date();
    let y = today.getFullYear();
    let m = String(today.getMonth() + 1).padStart(2, "0");
    let d = String(today.getDate()).padStart(2, "0");
    return y+m+d;
}

router.get('', function(req, res) {
    res.sendFile(path.join(__dirname, '../public/home/', 'index.html'));
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
        let currDate = getDate();
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
        res.status(404);
        res.sendFile('./public/404/index.html', { root: __dirname });
    }
});

router.post('/', async function(req, res) {
    let longUrl = req.body['longUrl'];
    // validate longUrl to be a valid url
    let pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    if (!pattern.test(longUrl)) {
        return res.send({ reqStatus: false, shortUrl: null, message: 'Given long URL is not a valid URL.' });
    }
    let customName = req.body['customName'];
    let url;
    if (customName != '') {
        // custom name requested
        url = await Url
        .findOne({
            shortUrl: customName
        });
        if (url) {
            // url with that customName already exists
            return res.send({ reqStatus: false, shortUrl: null, message: 'The name ' + customName + ' is not available.' });
        }
        else {
            url = new Url({
                longUrl: longUrl,
                shortUrl: customName,
                isCustom: true,
                creationDate: Date.now()
            });
            await url.save();
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
            url = new Url({
                longUrl: longUrl,
                creationDate: Date.now()
            });
            let hash = url['_id'].toString().slice(-6);
            while(await Url.findOne({ shortUrl: hash })) {
                // the current date is added to create randomness
                hash += Date.now().toString();
                hash = md5(hash).slice(-6);
            }
            url['shortUrl'] = hash;
            url['isCustom'] = false;
            await url.save();
        }
    }
    res.send({ reqStatus: true, shortUrl: url['shortUrl'], message: 'Shortened Url: ', shortUrl: websiteUrl + ':' + port.toString() + '/url/' + url['shortUrl'] });
});

// // This method will be implemented after user signup/login is implemented
// app.delete('/:id', function(req, res) {
    
// });

module.exports = router;