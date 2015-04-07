
const util = require('util');
const H = require('./helpers');

var ENV;

exports.setEnv = env => {
    ENV = env;
};

exports.auth = async (req, res) => {
    const code = req.query.code;

    const query = util.format('/access_token?client_id=%d&client_secret=%s&code=%s&redirect_uri=%s',
        ENV.APP_ID,
        ENV.SECRET_KEY,
        code,
        ENV.VK_RET_PATH
    );

    const json = await H.getJSON({
        host: 'oauth.vk.com',
        path: query
    });

    json['session_id'] = H.genHash(10);

    ENV.cUsers.update(
        { 'user_id': json['user_id'] },
        json,
        { upsert: 1 }
    );

    res.writeHead(302, {
        'Location': '/create.html',
        'Set-Cookie': 'sid=' + json['session_id']
    });

    res.end();
};

exports.create = (req, res) => {

    var sid = req.cookies['sid'];

    ENV.cUsers.find({
        'session_id': sid

    }).toArray(async (err, users) => {
        var userId = users[0]['user_id'];

        var quizId = H.genHash(10);

        var postId = req.body['post_id'].replace(/^wall/, '');

        var postInfo = await H.execVk({
            method: 'wall.getById',
            params: {
                'posts': postId,
                'extended': 0,
                'copy_history_depth': 0
            }
        });

        ENV.cQuizes.insert({
            'quiz_id': quizId,
            'owner_id': userId,
            'post_user_id': postInfo['from_id'],
            'post_id': postId,
            'name': req.body['name'],
            'end_date': req.body['end_date']
        }, (err) => {
            res.send({
                'quiz_id': quizId
            });
        });

    });

};

exports.quiz = (req, res) => {
    var quizId = req.query.q;

    ENV.cQuizes.find({
        'quiz_id': quizId
    }).toArray((err, quizes) => {

        res.send(quizes[0]);

    });
};
