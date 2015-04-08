
const jade = require('jade');
var API = require('./api');

exports.index = async (req, res) => {
    res.send(jade.renderFile('templates/index.jade', {}));
};

exports.create = async (req, res) => {
    res.send(jade.renderFile('templates/create.jade', {}));
};

exports.list = async (req, res) => {

    var user = await API.getSession(req);

    var quizesList = await API.list(user['owner_id']);

    res.send(jade.renderFile('templates/list.jade', {
        quizes: quizesList
    }));
};

exports.quiz = async (req, res) => {
    const quiz = await API.getQuiz(req.params.quidId);

    if (quiz) {
        res.send(jade.renderFile('templates/quiz.jade', quiz));
    } else {
        res.status(404).send(jade.renderFile('templates/not-found.jade'));
    }
};
