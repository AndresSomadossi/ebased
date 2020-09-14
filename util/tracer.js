const AWSXRay = require('aws-xray-sdk-core');

module.exports = {
  captureAWSClient: (client) => (process.env.IS_LOCAL) ? client : AWSXRay.captureAWSClient(client),
  captureHTTP: () => {
    if (!process.env.IS_LOCAL) {
      AWSXRay.captureHTTPsGlobal(require('http'));
      AWSXRay.captureHTTPsGlobal(require('https'));
    }
  },
}