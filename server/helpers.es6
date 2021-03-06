
const https = require('https');
const queryString = require('querystring');
require('colors');

exports.sleep = function(time) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, time)
    });
};

const get = exports.get = function(options) {
    return new Promise((resolve, reject) => {
        if (process.env['DEBUG_REQ']) {
            console.log('Request:'.green, options.host + options.path);
        }

        https
            .request(options, res => {
                var chunks = [];

                res
                    .on('data', chunks.push.bind(chunks))
                    .on('end', () => {
                        try {
                            resolve(chunks.join(''));
                        } catch (e) {
                            reject(e);
                        }
                    });
            })
            .on('error', reject)
            .end();
    });
};

const getJSON = exports.getJSON = function(options) {
    return get(options).then(data => JSON.parse(data));
};

exports.execVk = function(options) {
    return getJSON({
        host: 'api.vk.com',
        path: '/method/' + options.method + '?' + queryString.stringify(options.params) + '&version=5.29'
    }).then(json => json.response);
};

function findOneP(query) {
    return new Promise((resolve, reject) => {
        this.findOne(query, function(err, object) {
            if (err) {
                reject(err);
            } else {
                resolve(object);
            }
        });
    });
}

function findP(query) {
    return new Promise((resolve, reject) => {
        this.find(query).toArray((err, objects) => {
            if (err) {
                reject(err);
            } else {
                resolve(objects);
            }
        })
    });
}

function insertOneP(object) {
    return new Promise((resolve, reject) => {
        this.insertOne(object, err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        })
    });
}

function updateOneP(condition, operation) {
    return new Promise((resolve, reject) => {
        this.updateOne(condition, operation, (err) => {
            if (err) {
                reject();
            } else {
                resolve();
            }
        })
    });
}

exports.addPromiseMode = (collection) => {

    collection.findOneP = findOneP;
    collection.findP = findP;
    collection.insertOneP = insertOneP;
    collection.updateOneP = updateOneP;

    return collection;
};

var SYMBOLS_BASE = 'abcdefghijklmnopqrstuvwxyz';
SYMBOLS_BASE += SYMBOLS_BASE.toUpperCase();
SYMBOLS_BASE += '0123456789';

exports.genHash = function(n) {
    var hash = '';
    var l = SYMBOLS_BASE.length;

    for (var i = n; i; --i) {
        hash += SYMBOLS_BASE[Math.floor(Math.random() * l)];
    }

    return hash;
};
