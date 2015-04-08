
const https = require('https');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const _ = require('lodash');

const H = require('./helpers');
const API = require('./api');
const TPL = require('./tpl');

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

    console.log("Connected correctly to MongoDB server");

    ENV.cUsers = H.addPromiseMode(db.collection('users'));
    ENV.cQuizes = H.addPromiseMode(db.collection('quizes'));

    const app = express();

    app.use(cookieParser());
    app.use(bodyParser.json());

    app.get('/ok', safe(API.auth));

    app.post('/api/create.json', safe(API.create));
    app.get('/api/quiz.json', safe(API.quiz));

    app.get('/', safe(TPL.index));
    app.get('/create', safe(TPL.create));
    app.get('/list', safe(TPL.list));
    app.get('/quiz/:quidId', safe(TPL.quiz));

    app.use(express.static('../www'));

    const server = app.listen(8000, () => {

        const host = server.address().address;
        const port = server.address().port;

        console.log('Quizy listening at http://%s:%s', host, port);

        startFinishingScheduler();
    });

});

async function startFinishingScheduler() {
    while (true) {
        await makeFinish().catch(e => {
            console.warn(e);
        });

        await H.sleep(5000);
    }
}

async function makeFinish() {
    const NOW = Date.now();

    const quizes = await ENV.cQuizes.findP({
        'end_date': {
            $lte: NOW
        },
        'winner_id': null
    });

    if (quizes.length) {
        for (var i = 0; i < quizes.length; ++i) {
            await runFinish(quizes[i]);
        }
    }
}

async function runFinish(quiz) {
    var postId = quiz['post_id'].split('_').map(Number);

    const data = await H.execVk({
        method: 'wall.getReposts',
        params: {
            'owner_id': postId[0],
            'post_id': postId[1],
            'count': 1000
        }
    });

    var user = await chooseWinner(quiz, data);

    if (user) {
        await ENV.cQuizes.updateOneP({
            'quiz_id': quiz['quiz_id']
        }, {
            $set: {
                'winner_id': user['uid']
            }
        });
    }
}

async function chooseWinner(quiz, data) {
    const reposts = data.items;
    const profiles = data.profiles;

    if (reposts.length === 0) {
        return null;
    }

    const badIndexes = [];

    var winnerProfile = null;

    while (!winnerProfile) {

        let randomIndex = Math.floor(Math.random() * reposts.length);

        let userId = reposts[randomIndex]['to_id'];

        let profile = _.find(profiles, profile => profile['uid'] === userId);

        if (profile['photo_50'] === 'default') {
            badIndexes.push(randomIndex);
            continue;
        }

        // TODO: Доделать
        if (quiz['need_group_check']) {
            let inGroup = await H.execVk({
                method: 'groups.isMember',
                params: {
                    'group_id': 123,
                    'user_id': userId
                }
            });

            if (inGroup['member'] === 0) {
                badIndexes.push(randomIndex);
                continue;
            }
        }

        winnerProfile = profile;
    }

    return winnerProfile;
}

function safe(handler) {
    return (req, res) => {
        handler(req, res).catch(err => {
            res.status(500).send(err.stack);
        });
    };
}
