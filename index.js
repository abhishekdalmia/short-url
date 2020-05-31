const express = require('express');
const app = express();
const http = require('http').Server(app);
const mongoose = require('mongoose');
const process = require('process')
const path = require('path');
const md5 = require('md5');

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose.connect('mongodb://localhost/muffin')
    .then(function() {
        console.log('Connected to MongoDB...');
    })
    .catch(function(err) {
        console.error('Error occured while connecting to MongoDB: ', err);
    });

const urlSchema = new mongoose.Schema({
    longUrl: String,
    shortUrl: String,
    creationDate: { type: Date, default: Date.now() },
    expirationDate: { type: Date, default: Date.now() }
});

const Url = mongoose.model('url', urlSchema);


app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')))

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
        res.redirect(url['longUrl']);
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
                creationDate: Date.now()
            });
            await url.save();
            res.send({ reqStatus: true, shortUrl: url['shortUrl'], msg: 'Shortened Url: 127.0.0.1:' + port.toString() + '/' + url['shortUrl'] });
        }
    }
    else {
        // random shortUrl requested
        url = await Url
        .findOne({
            longUrl: longUrl
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
            await url.save();
        }
        res.send({ reqStatus: true, shortUrl: url['shortUrl'], msg: 'Shortened Url: 127.0.0.1:' + port.toString() + '/' + url['shortUrl'] });
    }
});

// // This method will be implemented after user signup/login is implemented
// app.delete('/:id', function(req, res) {
    
// });

const port = process.env.PORT || 3000
http.listen(port,
    // '0.0.0.0',
    function() {
        console.log(`Listening on ${port}`)
})