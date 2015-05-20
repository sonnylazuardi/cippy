var final_check = function() {
  var numberOfInstances = 3;
  this.checkTotalTrack = function(currentCount) {

    it('should have the same number of track after added', function() {

      browser.sleep(20000);
      element.all(by.repeater('track in arrangement.tracks')).count().then(function(count) {
        expect(count).toBe(currentCount + numberOfInstances);
      });
      
    });

  }
}
module.exports = new final_check();