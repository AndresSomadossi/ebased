const logger = require('../_helper/logger');

const METRIC_TYPES = {
  COMMAND_FINISHED: 'SYS.METRIC.DOWNSTREAM.COMMAND_FINISHED',
  DETAILED_COMMAND_FINISHED: 'SYS.LOG.DOWNSTREAM.DETAILED_COMMAND_FINISHED',
}

class DownstreamCommandMetric {
  constructor(service) {
    this.service = service;
    this.initTime = Date.now();
  }
  finish(skipDuration) {
    this.duration = (skipDuration) ? null : Date.now() - this.initTime;
    return this;
  }
  setRequest(timeout, destination, request) {
    this.timeout = timeout;
    this.destination = destination;
    this.request = (typeof request === 'object') ? JSON.stringify(request) : request;
    return this;
  }
  setResponse(code, status, response) {
    this.code = code;
    this.status = status;
    this.response = (typeof response === 'object') ? JSON.stringify(response) : response;
    return this;
  }
  publish() {
    logger.info({
      type: METRIC_TYPES.COMMAND_FINISHED,
      service: this.service,
      code: this.code,
      status: this.status,
      destination: this.destination,
      duration: this.duration,
      timeout: this.timeout,
    }, { color: ['FgMagenta', 'Reverse'] });
    logger.debug({
      type: METRIC_TYPES.DETAILED_COMMAND_FINISHED,
      request: this.request,
      response: this.response,
    }, { color: ['FgMagenta'] });
  }
}

module.exports = { DownstreamCommandMetric };