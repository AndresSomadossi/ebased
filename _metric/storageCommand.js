const logger = require('../_helper/logger');

const METRIC_TYPES = {
  COMMAND_FINISHED: 'SYS.METRIC.STORAGE.COMMAND_FINISHED',
  DETAILED_COMMAND_FINISHED: 'SYS.LOG.STORAGE.DETAILED_COMMAND_FINISHED',
}

class StorageCommandMetric {
  constructor(service, operation, params) {
    this.service = service;
    this.operation = operation;
    this.params = params;
    this.initTime = Date.now();
  }
  finish(result = {}, skipDuration) {
    this.duration = (skipDuration) ? null : Date.now() - this.initTime;
    this.result = result;
    this.publish();
  }
  publish() {
    logger.info({
      type: METRIC_TYPES.COMMAND_FINISHED,
      service: this.service,
      operation: this.operation,
      table: this.params.TableName,
      duration: this.duration,
      consumedCapacity: this.result.ConsumedCapacity && this.result.ConsumedCapacity.CapacityUnits,
      count: this.result.Count,
      scannedCount: this.result.ScannedCount,
    }, { color: ['FgMagenta', 'Reverse'] });
    logger.debug({
      type: METRIC_TYPES.DETAILED_COMMAND_FINISHED,
      params: this.params,
      result: this.result,
    }, { color: ['FgMagenta'] });
  }
}

module.exports = { StorageCommandMetric };