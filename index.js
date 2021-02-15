const express = require('express');
const app = express();
const http = require('http').Server(app);
const mongoose = require('mongoose');
const process = require('process');
const path = require('path');
const md5 = require('md5');
const config = require('config');
// routers:
const home = require('./routes/home');
const url = require('./routes/url');

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

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use('/home/', home);
app.use('/url/', url);

// Required to set port in default config file
const port = parseInt(config.get('Website.port'));

http.listen(port,
    // '0.0.0.0',
    function() {
        console.log(`Listening on ${port}`);
});