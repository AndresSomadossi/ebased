const logger = require('../../utils/logger');

const METRIC_TYPES = {
  REQUEST_FINISHED: 'SYS.METRIC.DOWNSTREAM.REQUEST_FINISHED',
  DETAILED_REQUEST_FINISHED: 'SYS.METRIC.DOWNSTREAM.DETAILED_REQUEST_FINISHED',
}

class RequestMetric {
  constructor() {
    this.initTime = Date.now();
  }
  finish(duration) {
    this.duration = (duration == null) ? Date.now() - this.initTime : duration;
    return this;
  }
  setRequest({ url, method, timeout, requestParams, requestBody, requestHeaders }) {
    this.url = url;
    this.method = method;
    this.timeout = timeout;
    this.requestParams = requestParams;
    this.requestBody = requestBody;
    this.requestHeaders = requestHeaders;
    return this;
  }
  setResponse({ level, code, status, responseBody, responseHeaders }) {
    this.level = level;
    this.code = code;
    this.status = status;
    this.responseBody = responseBody;
    this.responseHeaders = responseHeaders;
    return this;
  }
  publish() {
    this.infoLog = {
      type: METRIC_TYPES.REQUEST_FINISHED,
      code: this.code,
      status: this.status,
      request: `${this.method} ${this.url}`,
      duration: this.duration,
      timeout: this.timeout,
    };
    logger[this.level](this.infoLog);
    this.debugLog = {
      type: METRIC_TYPES.DETAILED_REQUEST_FINISHED,
      requestParams: JSON.stringify(this.requestParams),
      requestBody: JSON.stringify(this.requestBody),
      requestHeaders: JSON.stringify(this.requestHeaders),
      responseBody: JSON.stringify(this.responseBody),
      responseHeaders: JSON.stringify(this.responseHeaders),
    };
    logger.debug(this.debugLog);
  }
}

module.exports = { RequestMetric };