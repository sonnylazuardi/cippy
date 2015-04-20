/**
 * Caches and optimizes loading of buffers
 */
app.service('BufferLoader', function($q, $rootScope, SharedAudioContext, AudioCache){
  return {
    _cache: {},

    _deferreds: {},

    /**
     * Checks the cache and the deferred objects first before loading the bugger
     * @param  {String} bufferLocation The location of the buffer
     * @return {Deferred} a deffered object
     */
    load: function(buffer){
      var bufferLocation = buffer.location;
      // check if it's in the cache
      if(this._cache[bufferLocation]){
        var deferred = $q.defer();
        deferred.resolve(this._cache[bufferLocation]);
        return deferred.promise;
      // check if we're already loading the buffer
      }else if(this._deferreds[bufferLocation])
        return this._deferreds[bufferLocation].promise;
      // create a new deferred and load the buffer
      else
        return this._load(bufferLocation);
    },

    /**
     * Loads the buffer from the defined source and makes sure
     * that all deferreds are logged properly
     */
    _load: function(bufferLocation){
      // new deffered for this request
      var deferred = $q.defer();
      this._deferreds[bufferLocation] = deferred;

      // load the buffer
      var xhr = new XMLHttpRequest();
      xhr.open('GET', bufferLocation, true);
      xhr.responseType = 'arraybuffer';
      xhr.addEventListener("error",  this._transferFailed(bufferLocation, deferred), false);
      xhr.addEventListener("load", this._transferComplete(bufferLocation, deferred), false);
      xhr.onload = function(e) {
        this._decodeAudio(xhr.response, deferred, bufferLocation);
      }.bind(this);
      xhr.send();

      return deferred.promise;
    },

    _transferFailed: function(bufferLocation, deferred) {
      var self = this;
      // alert("An error occurred while transferring the file.");
      var splitter = bufferLocation.split('/');
      AudioCache.getCache(splitter[3]).then(function (result) {
        // var arrayBuffer;
        // var fileReader = new FileReader();
        // fileReader.onload = function() {

            function ab2str(buf) {
              return String.fromCharCode.apply(null, new Uint16Array(buf));
            }
            function str2ab(str) {
              var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
              var bufView = new Uint16Array(buf);
              for (var i=0, strLen=str.length; i < strLen; i++) {
                bufView[i] = str.charCodeAt(i);
              }
              return buf;
            }
            // console.log(result);
            // var base64String = Base64Binary.decodeArrayBuffer(result);
            // console.log('SAPI');
            // console.log(base64String);
            // arrayBuffer = this.result;
            // console.log("SAPI");
            // console.log(ab2str(result));
            self._decodeAudio(result, deferred, bufferLocation);
        // };
        // console.log(result);
        // fileReader.readAsArrayBuffer(result);
        // return this._decodeAudio()
      });
    
      // AudioCache.putCache(bufferLocation, splitter[3]);
    },

    _transferComplete: function(bufferLocation) {
      // var def = $q.defer();
      // alert("An error occurred while transferring the file.");
      var splitter = bufferLocation.split('/');
      AudioCache.putCache(bufferLocation, splitter[3]);
      
      // return def.promise;
      // AudioCache.putCache(bufferLocation, splitter[3]);
    },


    /**
     * Decoded's the audio, caches the buffer and resolves the deferreds
     */
    _decodeAudio: function(arrayBuffer, deferred, bufferLocation){
      function ab2str(buf) {
        return String.fromCharCode.apply(null, new Uint16Array(buf));
      }
      function str2ab(str) {
        var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
        var bufView = new Uint16Array(buf);
        for (var i=0, strLen=str.length; i < strLen; i++) {
          bufView[i] = str.charCodeAt(i);
        }
        return buf;
      }
      // console.log('ONTA');
      // console.log(ab2str(arrayBuffer));
      // console.log("SAPI");
      // console.log(ab2str(result));
      SharedAudioContext.getContext().decodeAudioData(arrayBuffer, function(buffer) {
        this._deferreds[bufferLocation] = undefined;
        this._cache[bufferLocation] = buffer;
        deferred.resolve(buffer);
        $rootScope.$emit('bufferloader:loaded', buffer);
      }.bind(this), function(e) {
        deferred.reject('Error decoding file', e);
      });
    }
  };
});