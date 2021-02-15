const express = require('express');
const { model } = require('mongoose');
const router = express.Router();

router.get('/', function(req, res) {
    res.send("Home Page.");
});

module.exports = router;