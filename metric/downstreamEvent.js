const logger = require('../util/logger');

const METRIC_TYPES = {
  EVENT_DELIVERED: 'SYS.METRIC.DOWNSTREAM.EVENT_DELIVERED',
  DETAILED_EVENT_DELIVERED: 'SYS.LOG.DOWNSTREAM.DETAILED_EVENT_DELIVERED',
}

class DownstreamEventMetric {
  constructor(service, timeout, destination, requestPayload) {
    this.initTime = Date.now();
    this.service = service;
    this.timeout = timeout;
    this.destination = destination;
    this.requestPayload = (typeof requestPayload === 'object') ? JSON.stringify(requestPayload) : requestPayload;
  }
  finish(duration) {
    this.duration = (duration == null) ? Date.now() - this.initTime : duration;
    return this;
  }
  setCode(code) {
    this.code = code;
    return this;
  }
  publish() {
    logger.info({
      type: METRIC_TYPES.EVENT_DELIVERED,
      service: this.service,
      code: this.code,
      destination: this.destination,
      duration: this.duration,
      timeout: this.timeout,
    });
    logger.debug({
      type: METRIC_TYPES.DETAILED_EVENT_DELIVERED,
      requestPayload: this.requestPayload,
    });
  }
}

module.exports = { DownstreamEventMetric };