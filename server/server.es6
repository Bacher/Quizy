
const https = require('https');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const H = require('./helpers');
const API = require('./api');

const MONGODB_URL = 'mongodb://localhost:27017/quizy';
const CONFIG = require('../config.json');
const ENV = {
    APP_ID: CONFIG['app_id'],
    SECRET_KEY: CONFIG['secret_key'],
    VK_RET_PATH: 'http://localhost:8000/ok'
};
API.setEnv(ENV);

MongoClient.connect(MONGODB_URL, function(err, db) {
    assert.equal(null, err);

    console.log("Connected correctly to server");

    ENV.cUsers = H.addPromiseMode(db.collection('users'));
    ENV.cQuizes = H.addPromiseMode(db.collection('quizes'));

    const app = express();

    app.use(cookieParser());
    app.use(bodyParser.json());

    app.get('/ok', safe(API.auth));

    app.post('/api/create.json', safe(API.create));
    app.get('/api/quiz.json', safe(API.quiz));

    app.use(express.static('../www'));

    const server = app.listen(8000, () => {

        const host = server.address().address;
        const port = server.address().port;

        console.log('Example app listening at http://%s:%s', host, port);

    });

});

function safe(handler) {
    return (req, res) => {
        handler(req, res).catch(err => {
            res.status(500).send(err.stack);
        });
    };
}
