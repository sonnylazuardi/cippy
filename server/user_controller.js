var config = require('./config');
var jwt = require('jwt-simple');
var qs = require('querystring');
var moment = require('moment');
var request = require('request');
var PouchDB = require('pouchdb');

var CouchURL = 'http://kabin.id:5984/';
var _ArrangementDB = 'cippy';
var _ChatDB = 'cippy_chats';
var _UserDB = 'cippy_users';


var db = new PouchDB(CouchURL + _ArrangementDB);
var UserDB = new PouchDB(CouchURL + _UserDB);

function ensureAuthenticated(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
  }
  var token = req.headers.authorization.split(' ')[1];
  var payload = jwt.decode(token, config.TOKEN_SECRET);
  if (payload.exp <= moment().unix()) {
    return res.status(401).send({ message: 'Token has expired' });
  }
  req.user = payload.sub;
  next();
}

function createToken(user) {
  var payload = {
    sub: user._id,
    iat: moment().unix(),
    exp: moment().add(14, 'days').unix()
  };
  return jwt.encode(payload, config.TOKEN_SECRET);
}

module.exports = {
  test: function(req, res) {
    // var map = function (doc) {
    //   if (doc.yuhu === 'yihaa') {
    //     emit(doc);
    //   }
    // }
    // db.query(map).then(function (result) {
    //   // handle result
    //   res.json(result);
    // }).catch(function (err) {
    //   // console.log(err);
    //   res.json(err);
    // });
    var user = {};
    user.facebook = 'testing';
    user.picture = 'https://graph.facebook.com/testing/picture?type=large';
    user.displayName = 'testing';
    UserDB.post(user, {include_docs: true}).then(function (user) {
      UserDB.get(user.id).then(function (user) {
        res.json(user);  
      });
      // var token = createToken(user);
      // res.send({ token: token });
    }).catch(function (err) {
      res.json(err);
    });
  },
  getApiMe: function(req, res) {
    UserDB.get(req.user).then(function(user) {
      res.send(user);
    }).catch(function(err) {
      res.json(err);
    });
  },
  putApiMe: function(req, res) {
    UserDB.get(req.user).then(function(user) {
      user.displayName = req.body.displayName || user.displayName;
      user.email = req.body.email || user.email;
      UserDB.put(user).then(function (result) {
        res.status(200).end();
      }).catch(function(err) {
        res.json(err);
      });
    }).catch(function(err) {
      return res.status(400).send({ message: 'User not found' });
    });
  },
  authFacebook: function(req, res) {
    var accessTokenUrl = 'https://graph.facebook.com/v2.3/oauth/access_token';
    var graphApiUrl = 'https://graph.facebook.com/v2.3/me';
    var params = {
      code: req.body.code,
      client_id: req.body.clientId,
      client_secret: config.FACEBOOK_SECRET,
      redirect_uri: req.body.redirectUri
    };

    // Step 1. Exchange authorization code for access token.
    request.get({ url: accessTokenUrl, qs: params, json: true }, function(err, response, accessToken) {
      if (response.statusCode !== 200) {
        return res.status(500).send({ message: accessToken.error.message });
      }
      // accessToken = qs.parse(accessToken);

      // Step 2. Retrieve profile information about the current user.
      request.get({ url: graphApiUrl, qs: accessToken, json: true }, function(err, response, profile) {
        if (response.statusCode !== 200) {
          return res.status(500).send({ message: profile.error.message });
        }
        if (req.headers.authorization) {
          var query = function (doc) {
            if (doc.facebook === profile.id) {
              emit(doc);
            }
          }
          UserDB.query(query).then(function(existingUser) {
            if (existingUser.rows.length) {
              return res.status(409).send({ message: 'There is already a Facebook account that belongs to you' });
            }
            var token = req.headers.authorization.split(' ')[1];
            var payload = jwt.decode(token, config.TOKEN_SECRET);
            UserDB.get(payload.sub).then(function (user) {
              user.facebook = profile.id;
              user.picture = user.picture || 'https://graph.facebook.com/v2.3/' + profile.id + '/picture?type=large';
              user.displayName = user.displayName || profile.name;
              UserDB.put(user).then(function (result) {
                var token = createToken(user);
                res.send({ token: token });
              });
            }).catch(function(err) {
              return res.status(400).send({ message: 'User not found' });
            });
          });
        } else {
          var query = function (doc) {
            if (doc.facebook === profile.id) {
              emit(doc);
            }
          }
          // Step 3b. Create a new user account or return an existing one.
          UserDB.query(query).then(function(existingUser) {
            if (existingUser.rows.length) {
              var token = createToken(existingUser);
              return res.send({ token: token });
            }
            var user = {};
            user.facebook = profile.id;
            user.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
            user.displayName = profile.name;
            UserDB.post(user).then(function (user) {
              UserDB.get(user.id).then(function (user) {
                var token = createToken(user);
                res.send({ token: token });
              });
            });
          }).catch(function(err) {
            res.json(err);
          });
        }
      });
    });
  },

  authUnlink: function(req, res) {
    var provider = req.params.provider;
      UserDB.get(req.user).then(function(user) {
        user[provider] = undefined;
        // user.save(function() {
        //   res.status(200).end();
        // });
        UserDB.put(user).then(function (result) {
          res.status(200).end();
        }).catch(function(err) {
          res.json(err);
        });
      }).catch(function(err) {
        return res.status(400).send({ message: 'User not found' });
      });
  },

  ensureAuthenticated: ensureAuthenticated
};


