const tracer = require('../../_helper/tracer');
const { DownstreamCommandMetric } = require('../../_metric/downstreamCommand');
const { ErrorHandled, FaultHandled } = require('../../util/error');
tracer.captureHTTP();
const axios = require('axios').default;

const layer = 'DOWNSTREAM_REQUEST';
const CODES = {
  REQUEST_FINISHED_OK: 'REQUEST_FINISHED_OK',
  REQUEST_CLIENT_ERROR: 'REQUEST_CLIENT_ERROR',
  REQUEST_SERVER_FAULT: 'REQUEST_SERVER_FAULT',
  REQUEST_INVOCATION_FAULT: 'REQUEST_INVOCATION_FAULT',
};

module.exports = async (params, commandMeta) => {
  try {
    verifyParams(params);
    injectMeta(params, commandMeta);
    const metric = new DownstreamCommandMetric(layer);
    const result = await axios.request(params).catch(error => {
      const errorName = `${error.name}-${error.message}`;
      const { url, method, timeout, data: requestBody = {}, headers: requestHeaders = {}, params: requestParams = {} } = error.config;
      metric.finish().setRequest(timeout, `${method} ${url}`, { requestBody, requestParams, requestHeaders });
      if (error.response) {
        // Handled Downstream Errors
        const { status, data: responseBody = {}, headers: responseHeaders = {} } = error.response;
        metric.setResponse(CODES.REQUEST_CLIENT_ERROR, status, { responseBody, responseHeaders }).publish();
        if (status < 500) throw new ErrorHandled(responseBody, { code: CODES.REQUEST_CLIENT_ERROR, status, layer });
        else throw new FaultHandled(responseBody, { code: CODES.REQUEST_SERVER_FAULT, layer });
      }
      // Downstream Unhanlded Faults
      metric.setResponse(CODES.REQUEST_SERVER_FAULT, 500, errorName).publish();
      throw new FaultHandled(errorName, { code: CODES.REQUEST_SERVER_FAULT, layer });
    })
    // Request OK
    const { url, method, timeout, data: requestBody = {}, headers: requestHeaders = {}, params: requestParams = {} } = result.config;
    const { status, data: responseBody = {}, headers: responseHeaders = {} } = result;
    metric.finish()
      .setRequest(timeout, `${method} ${url}`, { requestBody, requestParams, requestHeaders })
      .setResponse(CODES.REQUEST_FINISHED_OK, status, { responseBody, responseHeaders })
      .publish();
    return responseBody;
  } catch (error) {
    throw FaultHandled.captureUnhanlded(error, { code: CODES.REQUEST_INVOCATION_FAULT, layer });
  }
};

function verifyParams(params) {
  if (params.timeout) params.timeout = parseInt(params.timeout);
  if (isNaN(params.timeout)) throw new Error('Invalid timeout value');
}

function injectMeta(params, commandMeta) {
  if (commandMeta) {
    params.headers = { ...params.headers, ...commandMeta };
    const metaMapping = {
      tracedDuration: 'traced-duration',
      clientId: 'client-id',
      trackingTag: 'tracking-tag',
      id: 'id',
      source: 'source',
      time: 'time',
      type: 'type',
      specversion: 'specversion',
    };
    Object.keys(commandMeta).forEach(p => {
      params.headers[metaMapping[p]] = (typeof commandMeta[p] === 'string') ? commandMeta[p] : JSON.stringify(commandMeta[p])
    })
  }
}