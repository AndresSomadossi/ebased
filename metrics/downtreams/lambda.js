const logger = require('../../utils/logger');

const METRIC_TYPES = {
  LAMBDA_CALL_FINISHED: 'SYS.METRIC.DOWNSTREAM.LAMBDA_CALL_FINISHED',
  DETAILED_LAMBDA_CALL_FINISHED: 'SYS.METRIC.DOWNSTREAM.DETAILED_LAMBDA_CALL_FINISHED',
}

class LambdaCallMetric {
  constructor({ FunctionName, Payload, InvocationType, }, timeout) {
    this.initTime = Date.now();
    this.functionName = FunctionName;
    this.requestPayload = Payload;
    this.invocationType = InvocationType;
    this.timeout = timeout;
  }
  finish(duration) {
    this.duration = (duration == null) ? Date.now() - this.initTime : duration;
    return this;
  }
  setResponse({ level, code, status, responsePayload, functionVersion }) {
    this.level = level;
    this.code = code;
    this.status = status;
    this.responsePayload = responsePayload;
    this.functionVersion = functionVersion;
    return this;
  }
  publish() {
    this.infoLog = {
      type: METRIC_TYPES.LAMBDA_CALL_FINISHED,
      code: this.code,
      status: this.status,
      invocationType: this.invocationType,
      functionName: this.functionName,
      functionVersion: this.functionVersion,
      duration: this.duration,
      timeout: this.timeout,
    };
    logger[this.level](this.infoLog);
    this.debugLog = {
      type: METRIC_TYPES.DETAILED_LAMBDA_CALL_FINISHED,
      requestPayload: JSON.stringify(this.requestPayload),
      responsePayload: JSON.stringify(this.responsePayload),
    };
    logger.debug(this.debugLog);
  }
}

module.exports = { LambdaCallMetric };
