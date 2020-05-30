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
    // called from the file rendered by get request for home
    let longUrl = req.body['longUrl'];

    let url = await Url
    .findOne({
        longUrl: longUrl
    });
    let shortUrl = '127.0.0.1:3000/';
    if (!url) {
        url = new Url({
            longUrl: longUrl,
            creationDate: Date.now()
        });
        let hash = url['_id'].toString().slice(-6);
        while(await Url.findOne({ shortUrl: hash })) {
            hash = md5(hash).slice(-6);
        }
        url['shortUrl'] = hash;
        await url.save();
    }
    shortUrl += url['shortUrl'];
    res.send({ shortUrl: shortUrl });
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