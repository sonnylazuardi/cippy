app.factory('Account', function($http) {
  
  return {
    getProfile: function() {
      // console.log('getProfile');
      return $http.get('/api/me');
    },
    updateProfile: function(profileData) {
      // console.log('updateProfile');
      return $http.put('/api/me', profileData);
    }
  };
});