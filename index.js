const express = require('express');
const app = express();
const http = require('http').Server(app);
const mongoose = require('mongoose');
const process = require('process')
const path = require('path');
const md5 = require('md5');
const config = require('config');

let websiteUrl = config.get('Website.url');

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose.connect('mongodb://localhost/short-url')
    .then(function() {
        console.log('Connected to MongoDB...');
    })
    .catch(function(err) {
        console.error('Error occured while connecting to MongoDB: ', err);
    });

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


app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function getDate() {
    let today = new Date();
    let y = today.getFullYear();
    let m = String(today.getMonth() + 1).padStart(2, "0");
    let d = String(today.getDate()).padStart(2, "0");
    return y+m+d;
}

app.get('', function(req, res) {
    // handling get request for home page, which provides facility to shorten a url
    res.sendFile('./public/home/index.html', { root: __dirname });
});

app.get('/:shortUrl', async function(req, res) {
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
        // res.status(301).redirect("https://www.google.com");
        // res.status(301).redirect(url['longUrl']);
        // res.status(200).send('<script>window.location.href="https://your external ref"</script>');
        // res.status(200).send('<script>window.location.href=' + url['longUrl'] +'</script>');
    }
    else {
        res.status(404);
        res.sendFile('./public/404/index.html', { root: __dirname });
    }

});

app.post('/', async function(req, res) {

    let longUrl = req.body['longUrl'];
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
            res.send({ reqStatus: false, shortUrl: null, msg: 'The name ' + customName + ' is not available.' });
        }
        else {
            url = new Url({
                longUrl: longUrl,
                shortUrl: customName,
                isCustom: true,
                creationDate: Date.now()
            });
            await url.save();
            // res.send({ reqStatus: true, shortUrl: url['shortUrl'], msg: 'Website.url config: ' + websiteUrl + 'Shortened Url: 127.0.0.1:' + port.toString() + '/' + url['shortUrl'] });
            res.send({ reqStatus: true, shortUrl: url['shortUrl'], msg: 'Shortened Url: ' + websiteUrl + ':' + port.toString() + '/' + url['shortUrl'] });
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
        res.send({ reqStatus: true, shortUrl: url['shortUrl'], msg: 'Shortened Url: ' + websiteUrl + ':' + port.toString() + '/' + url['shortUrl'] });
    }
});

// // This method will be implemented after user signup/login is implemented
// app.delete('/:id', function(req, res) {
    
// });

let port;
if (config.has('Website.url')) {
    port = parseInt(config.get('Website.port'));
}
else {
    port = 3000;
}

http.listen(port,
    // '0.0.0.0',
    function() {
        console.log(`Listening on ${port}`);
});