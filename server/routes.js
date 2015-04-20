var ArrangementController = require('./arrangement_controller');
var UserController = require('./user_controller');
var path = require('path');

module.exports = function(app){
  app.get('/test', UserController.test);
  app.post('/auth/facebook', UserController.authFacebook);
  app.post('/auth/unlink/:provider', UserController.ensureAuthenticated, UserController.authFacebook);

  app.get('/api/me', UserController.ensureAuthenticated, UserController.getApiMe);
  app.put('/api/me', UserController.ensureAuthenticated, UserController.putApiMe);

  app.get('/sign_s3', ArrangementController.signS3);
  app.delete('/delete_s3/:s3Id', ArrangementController.deleteUpload);

  app.get('/cippy.appcache', function (req, res) {
    res.header("Content-Type", "text/cache-manifest");
    res.sendFile(path.resolve('public/test.appcache'));
  });
};