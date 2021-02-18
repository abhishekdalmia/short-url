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
const auth = require('./routes/auth');

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
        process.exit(1);
    });

// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
// handle the route handler for root of the website before any other middleware/route handler
app.get('/', function(req, res) {
    // this function will give the option to signup/signin or directly use the short-url service
    res.send("root called");
});
// the home api is just to test the auth middleware
// the auth middleware adds the jwt payload, which at this point of time consists of the object with 'userId' key
// in case of a valid jwt present in the request header, req.user is set to be an object with a 'userId' property
// in case of an invalid or non-existent jwt in the request header, req.user is set as an empty object
app.use('/home/', home);
app.use('/url/', url);
app.use('/user/', user);
app.use('/auth/', auth);

// Required to set port in default config file
const port = parseInt(config.get('Website.port'));

http.listen(port,
    // '0.0.0.0',
    function() {
        console.log(`Listening on ${port}`);
});