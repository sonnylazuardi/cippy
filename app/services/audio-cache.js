app.service('AudioCache', function($http, $q) {
  var self = this;
  window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
  self.filesystem = null;

  self.errorHandler = function(error) {
    var message = '';

    switch (error.code) {
      case FileError.SECURITY_ERR:
        message = 'Security Error';
        break;
      case FileError.NOT_FOUND_ERR:
        message = 'Not Found Error';
        break;
      case FileError.QUOTA_EXCEEDED_ERR:
        message = 'Quota Exceeded Error';
        break;
      case FileError.INVALID_MODIFICATION_ERR:
        message = 'Invalid Modification Error';
        break;
      case FileError.INVALID_STATE_ERR:
        message = 'Invalid State Error';
        break;
      default:
        message = 'Unknown Error';
        break;
    }
    console.log(message);
  };

  self.initFileSystem = function() {
    navigator.webkitPersistentStorage.requestQuota(1024 * 1024 * 5,
      function(grantedSize) {
        window.requestFileSystem(window.PERSISTENT, grantedSize, function(fs) {
          self.filesystem = fs;
        }, self.errorHandler);
      }, self.errorHandler);
  };

  self.downloadFile = function(url, success) {
    var xhr = new XMLHttpRequest(); 
    xhr.open('GET', url, true); 
    xhr.responseType = "blob";
    xhr.onload = function () { 
      success(xhr.response);
    };
    xhr.send(null); 
  };

  self.saveFile = function(filename, content) {
    self.filesystem.root.getFile(filename, {create: true}, function(fileEntry) {

      fileEntry.createWriter(function(fileWriter) {

        fileWriter.onwriteend = function(e) {
          // $('#status').html('file saved :)');
          console.log('cache saved');
        };

        fileWriter.onerror = function(e) {
          console.log('Write error: ' + e.toString());
          alert('An error occurred and your file could not be saved!');
        };

        var wavString = content;
        var len = wavString.length;
        var buf = new ArrayBuffer(len);
        var view = new Uint8Array(buf);
        for (var i = 0; i < len; i++) {
          view[i] = wavString.charCodeAt(i) & 0xff;
        }
        var contentBlob = new Blob([view], {type: 'audio/wav'});

        fileWriter.write(contentBlob);

      }, self.errorHandler);

    }, self.errorHandler);
  };

  self.loadFile = function(filename, success) {
    self.filesystem.root.getFile(filename, {}, function(fileEntry) {

      fileEntry.file(function(file) {
        var reader = new FileReader();

        reader.onload = function(e) {
          success(this.result);
        };

        reader.readAsArrayBuffer(file);
      }, self.errorHandler);

    }, self.errorHandler);
  };

  self.getCache = function(file) {
    var def = $q.defer();
    self.loadFile(file, function (result) {
      def.resolve(result);
    });
    return def.promise;
  };

  self.putCache = function(location, file) {
    self.downloadFile(location, function(blob) {
      self.saveFile(file, blob);
    });
  };

  self.initFileSystem();

  return self;
});