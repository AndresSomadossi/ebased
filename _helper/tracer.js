process.env.AWS_XRAY_CONTEXT_MISSING = 'LOG_ERROR';
const AWSXRay = require('aws-xray-sdk-core');

module.exports = {
  captureAWSClient: (client) => {
    return (!process.env.IS_LOCAL) ? AWSXRay.captureAWSClient(client) : client;
  },
  captureHTTP: () => {
    if (!process.env.IS_LOCAL) {
      AWSXRay.captureHTTPsGlobal(require('http'));
      AWSXRay.captureHTTPsGlobal(require('https'));
    }
  },
}