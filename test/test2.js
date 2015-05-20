describe('cippy application concurrent test case', function() {

  beforeEach(function() {
    browser.get('http://localhost:8080/#/editor_test/hello');
  });


  it('should sync to other clients', function() {
    var currentCount = 0;

    function doChecking() {
      describe('should checking test case', function() {
        it('should have the same number of track after added', function() {
          
          browser.sleep(20000);

          element.all(by.repeater('track in arrangement.tracks')).count().then(function(count) {
            console.log(count);
            expect(count).toBe(currentCount + 1);
          });
          
        });

        // it('should have the same title of track after changed', function() {
        //   var newTitle = 'Ganti Title';

        //   element.all(by.repeater('track in arrangement.tracks')).then(function(tracks) {
        //     var title = tracks[0].element(by.model('track.title'));

        //     title.clear().then(function() {

        //       title.sendKeys(newTitle);
        //       title.sendKeys(protractor.Key.ENTER);  

        //     });
        //   });

        // });
      });
      
    }


    browser.wait(function() {
      return element.all(by.repeater('track in arrangement.tracks')).count().then(function(count) {
        if (count > 0) {
          currentCount = count;
          console.log(currentCount);
          doChecking();
          return true;
        } else {
          return false;
        }
      });  
    }, 15000);
    


  });

});
