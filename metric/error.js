const logger = require('../util/logger');

const METRIC_TYPES = {
  FAULT_HANDLED: 'SYS.METRIC.ERROR.FAULT_HANDLED',
  ERROR_HANDLED: 'SYS.METRIC.ERROR.ERROR_HANDLED',
};

module.exports = {
  faultHandled(error) {
    logger.error({
      type: METRIC_TYPES.FAULT_HANDLED,
      status: error.status,
      code: error.code,
      layer: error.layer,
      message: JSON.stringify(error.message),
      stack: error.stack,
    })
  },
  errorHandled(error) {
    logger.error({
      type: METRIC_TYPES.ERROR_HANDLED,
      status: error.status,
      code: error.code,
      layer: error.layer,
      message: JSON.stringify(error.message),
    })
  },
}