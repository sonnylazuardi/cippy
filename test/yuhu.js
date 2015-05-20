describe('cippy application concurrent test case', function() {

  beforeEach(function() {
    browser.get('http://localhost:8080/#/editor_test/hello');
  });

  it('should sync to other clients', function() {

    var currentCount = 0;
    var final_check = require('./final_check.js');

    function doChecking() {
      describe('checking the case', function() {

        it('should add track', function() {

          // browser.sleep(Math.floor((Math.random() * 3) + 1) * 1000 + 5000);
          browser.sleep(8000);
          element(by.css('button.add-track')).click();
          element(by.css('.add-track-menu li:nth-child(1)')).click();

        });

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
    }, 50000);

  });


});

