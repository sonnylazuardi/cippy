describe('cippy application concurrent test case', function() {

  beforeEach(function() {
    browser.get('http://localhost:8080/#/editor_test/hello');
  });

  it('should sync to other clients', function() {

    var currentCount = 0;
    var final_check = require('./final_check.js');

    function doChecking() {

      describe('should checking test case', function() {

        console.log(currentCount);
        // it('should add a track', function() {
          browser.wait(function() {
            var def = protractor.promise.defer();
            setTimeout(function() {
              element(by.css('button.add-track')).click();
              element(by.css('.add-track-menu li:nth-child(1)')).click();
              def.fulfill(true);
            }, 15000);
            return def.promise;
          });
          
        // });

        final_check.checkTotalTrack(currentCount);

      });
      
    }
    

    browser.wait(function() {
      return element.all(by.repeater('track in arrangement.tracks')).count().then(function(count) {
        if (count > 0) {
          currentCount = count;
          doChecking();
          return true;
        } else {
          return false;
        }
      });  
    }, 30000);

  });


});
