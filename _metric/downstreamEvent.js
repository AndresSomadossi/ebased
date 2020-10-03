const logger = require('../_helper/logger');

const METRIC_TYPES = {
  EVENT_DELIVERED: 'SYS.METRIC.DOWNSTREAM.EVENT_DELIVERED',
  DETAILED_EVENT_DELIVERED: 'SYS.LOG.DOWNSTREAM.DETAILED_EVENT_DELIVERED',
}

class DownstreamEventMetric {
  constructor(service, timeout, destination, eventData) {
    this.initTime = Date.now();
    this.service = service;
    this.timeout = timeout;
    this.destination = destination;
    this.eventData = (typeof eventData === 'object') ? JSON.stringify(eventData) : eventData;
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
    }, { color: ['FgCyan', 'Reverse'] });
    logger.debug({
      type: METRIC_TYPES.DETAILED_EVENT_DELIVERED,
      eventData: this.eventData,
    }, { color: ['FgCyan'] });
  }
}

module.exports = { DownstreamEventMetric };