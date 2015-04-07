
const https = require('https');
const util = require('util');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const CONFIG = require('../config.json');

const APP_ID = CONFIG['app_id'];
const SECRET_KEY = CONFIG['secret_key'];

// Connection URL
var url = 'mongodb://localhost:27017/quizy';
MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);

    console.log("Connected correctly to server");

    const cUsers = db.collection('users');

    const app = express();

    app.get('/ok', async function(req, res) {
        const code = req.query.code;

        const query =
            util.format('/access_token?client_id=%s&client_secret=%s&code=%s&redirect_uri=%s',
                APP_ID,
                SECRET_KEY,
                code,
                'http://localhost:8000/ok'
            );

        const json = await httpsJSON({
            host: 'oauth.vk.com',
            path: query
        });

        json['session_id'] = genhash(10);

        await cUsers.update(
            {
                'user_id': json['user_id']
            },
            json,
            {
                upsert: 1
            }
        );

        res.writeHead(302, {
            'Location': '/create.html',
            'Set-Cookie': 'sid=' + json['session_id']
        });

        res.end();

    });

    app.get('/hello', (req, res) => {
        res.send('Hello World!');
    });

    app.use(express.static('../www'));

    const server = app.listen(8000, () => {

        const host = server.address().address;
        const port = server.address().port;

        console.log('Example app listening at http://%s:%s', host, port);

    });

});

function sleep(time) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, time)
    });
}

function httpsJSON(options) {
    return new Promise((resolve, reject) => {
        https
            .request(options, res => {
                var chunks = [];

                res.on('data', chunks.push.bind(chunks));

                res.on('end', () => {
                    try {
                        resolve(JSON.parse(chunks.join('')));
                    } catch(e) {
                        reject(e);
                    }
                })

            })
            .on('error', reject)
            .end();
    });
}


var SYMBOLS_BASE = 'abcdefghijklmnopqrstuvwxyz';
SYMBOLS_BASE += SYMBOLS_BASE.toUpperCase();
SYMBOLS_BASE += '0123456789';

function genhash(n) {
    var hash = '';
    var l = SYMBOLS_BASE.length;

    for (var i = n; i; --i) {
        hash += SYMBOLS_BASE[Math.floor(Math.random() * l)];
    }

    return hash;
}
