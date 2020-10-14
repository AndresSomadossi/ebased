const disabled = (process.env.EBASED_DISABLE_X_RAY == 'true') ? true : false;
const AWSXRay = require('aws-xray-sdk-core');

module.exports = {
  captureAWSClient: (client) => {
    return (!process.env.IS_LOCAL && !disabled) ? AWSXRay.captureAWSClient(client) : client;
  },
  captureHTTP: () => {
    if (!process.env.IS_LOCAL && !disabled) {
      AWSXRay.captureHTTPsGlobal(require('http'));
      AWSXRay.captureHTTPsGlobal(require('https'));
    }
  },
}