// An example configuration file.
exports.config = {
  directConnect: true,

  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'chrome',
    // shardTestFiles: false,
    // maxInstances: 2
  },

  // Spec patterns are relative to the current working directly when
  // protractor is called.
  specs: ['test_spec.js'],

  // multiCapabilities: [
  //   {
  //     'browserName': 'chrome'
  //   },
  //   {
  //     'browserName': 'chrome'
  //   },
  //   {
  //     'browserName': 'chrome'
  //   }
  // ],

  // Options to be passed to Jasmine-node.
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000
  }
};
