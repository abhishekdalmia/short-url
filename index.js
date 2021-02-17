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
const user = require('./routes/user');

if (!config.get('jwtPrivateKey')) {
    console.error('FATAL ERROR: jwtPrivateKey is not defined.');
    process.exit(1);
}

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
// handle the route handler for root of the website before any other middleware/route handler
app.get('/', function(req, res) {
    // this function will give the option to signup/signin or directly use the short-url service
    res.send("root called");
});
app.use('/home/', home);
app.use('/url/', url);
app.use('/user/', user);

// Required to set port in default config file
const port = parseInt(config.get('Website.port'));

http.listen(port,
    // '0.0.0.0',
    function() {
        console.log(`Listening on ${port}`);
});