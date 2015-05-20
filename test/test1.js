describe('cippy application concurrent test case', function() {

  beforeEach(function() {
    browser.get('http://localhost:8080/#/editor_test/hello');
  });

  it('should sync to other clients', function() {

    var currentCount = 0;

    function doChecking() {

      describe('should checking test case', function() {
        it('should have the same number of track after added', function() {
          element(by.css('button.add-track')).click();
          element(by.css('.add-track-menu li:nth-child(1)')).click();
          browser.sleep(20000);
          element(by.css('button.add-track')).click();
          console.log('hello');
        });

        // it('should have the same title of track after changed', function() {
         
        //   var newTitle = 'Ganti Title';
        
        //   browser.wait(function() {
        //     // setTimeout(function() {
        //       return element.all(by.repeater('track in arrangement.tracks')).then(function(tracks) {
        //         var title = tracks[0].element(by.model('track.title'));

        //         return expect(title.getText()).toEqual(newTitle);
        //       });
        //       // return true;
        //     // }, 20000);
        //   }, 20000);

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
