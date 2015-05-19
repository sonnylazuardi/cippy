describe('cippy application concurrent test case', function() {

  var browser2;

  beforeEach(function() {
    browser.get('http://localhost:8080/#/editor/musik-baru');
    browser2 = browser.forkNewDriverInstance(true);
    browser3 = browser.forkNewDriverInstance(true);
  });


  it('should sync to other client', function() {

    element(by.css('button.add-track')).click();
    var currentCount = 0;
    var browserReady1 = false;
    var browserReady2 = false;
    var browserReady3 = false;

    function doChecking() {

      describe('cippy application test case', function() {

        it('should have the same number of track after added', function() {

          element(by.css('.add-track-menu li:nth-child(1)')).click();
          element.all(by.repeater('track in arrangement.tracks')).count().then(function(count) {
            expect(count).toBe(currentCount + 1);
          });

          browser2.element.all(by.repeater('track in arrangement.tracks')).count().then(function(count) {
            expect(count).toBe(currentCount + 1);
          });

          browser3.element.all(by.repeater('track in arrangement.tracks')).count().then(function(count) {
            expect(count).toBe(currentCount + 1);
          });

        });

        it('should have the same title of track after changed', function() {
          var newTitle = 'Ganti Title';
          element.all(by.repeater('track in arrangement.tracks')).then(function(tracks) {
            var title = tracks[0].element(by.model('track.title'));

            title.clear().then(function() {
              title.sendKeys(newTitle);
              title.sendKeys(protractor.Key.ENTER);  

              browser2.element.all(by.repeater('track in arrangement.tracks')).then(function(tracks) {
                var title = tracks[0].element(by.model('track.title'));

                expect(title.getText()).toEqual(newTitle);
              });

              browser3.element.all(by.repeater('track in arrangement.tracks')).then(function(tracks) {
                var title = tracks[0].element(by.model('track.title'));

                expect(title.getText()).toEqual(newTitle);
              });

            });
            
          });

                
        });        

      });
    }

    browser.wait(function() {
      return element.all(by.repeater('track in arrangement.tracks')).count().then(function(count) {
        if (count > 0) {
          currentCount = count;
          browserReady1 = true;
          return true;
        } else {
          return false;
        }
      });
    }, 10000);
    browser2.wait(function() {
      return browser2.element.all(by.repeater('track in arrangement.tracks')).count().then(function(count) {
        if (count > 0) {
          browserReady2 = true;
          return true;
        } else {
          return false;
        }
      });
    }, 10000);
    browser3.wait(function() {
      return browser3.element.all(by.repeater('track in arrangement.tracks')).count().then(function(count) {
        if (count > 0) {
          browserReady3 = true;
          return true;
        } else {
          return false;
        }
      });
    }, 10000);
    browser3.wait(function() {
      if (browserReady1 && browserReady2 && browserReady3) {
        doChecking();
        return true;
      } else {
        return false;
      }
    }, 10000);
  });

});
