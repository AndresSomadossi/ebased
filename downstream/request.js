const tracer = require('../utils/tracer');
tracer.captureHTTP();
const axios = require('axios').default;

const { RequestMetric } = require('../metrics/downtreams/request');
const { ErrorHandled, FaultHandled, Handled } = require('../utils/error');

const LAYER = 'DOWNSTREAM_REQUEST';
const CODES = {
  REQUEST_FINISHED_OK: 'REQUEST_FINISHED_OK',
  REQUEST_CLIENT_ERROR: 'REQUEST_CLIENT_ERROR',
  REQUEST_SERVER_ERROR: 'REQUEST_SERVER_ERROR',
  REQUEST_INVOCATION_ERROR: 'REQUEST_INVOCATION_ERROR',
};

module.exports = async (params) => {
  try {
    verifyParams(params);
    const metric = new RequestMetric();
    const result = await axios
      .request(params)
      .catch(error => {
        const errorName = `${error.name}-${error.message}`;
        const { url, method, timeout, data: requestBody = {}, headers: requestHeaders = {}, params: requestParams = {} } = error.config;
        metric.finish().setRequest({ url, method, timeout, requestBody, requestHeaders, requestParams })
        if (error.response) {
          //Handled Downstream Errors
          const { status, data: responseBody = {}, headers: responseHeaders = {} } = error.response;
          metric.setResponse({ level: 'error', code: CODES.REQUEST_CLIENT_ERROR, status, responseBody, responseHeaders }).publish();
          if (status < 500) throw new ErrorHandled(responseBody, { code: CODES.REQUEST_CLIENT_ERROR, status, layer: LAYER });
          else throw new FaultHandled(responseBody, { code: CODES.REQUEST_SERVER_ERROR, layer: LAYER });
        }
        metric.setResponse({ level: 'error', code: CODES.REQUEST_SERVER_ERROR, status: 500 }).publish();
        throw new FaultHandled(errorName, { code: CODES.REQUEST_SERVER_ERROR, layer: LAYER });
      })
    //Request OK
    const { url, method, timeout, data: requestBody = {}, headers: requestHeaders = {}, params: requestParams = {} } = result.config;
    const { status, data: responseBody = {}, headers: responseHeaders = {} } = result;
    metric.finish()
      .setRequest({ url, method, timeout, requestBody, requestHeaders, requestParams })
      .setResponse({ level: 'info', code: CODES.REQUEST_FINISHED_OK, status, responseBody, responseHeaders })
      .publish();
    return responseBody;
  } catch (error) {
    if (error instanceof Handled) throw error;
    throw new FaultHandled(`${error.name}-${error.message}`, { code: CODES.REQUEST_INVOCATION_ERROR, layer: LAYER });
  }
};

function verifyParams(params) {
  if (params.timeout) params.timeout = parseInt(params.timeout);
  if (isNaN(params.timeout)) throw new Error('Invalid timeout value');
}