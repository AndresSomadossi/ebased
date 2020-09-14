const logger = require('../util/logger');

const METRIC_TYPES = {
  OUTPUT_ERROR_RETURNED: 'SYS.METRIC.OUTPUT.OUTPUT_ERROR_RETURNED',
  OUTPUT_RETURNED: 'SYS.METRIC.OUTPUT.OUTPUT_RETURNED',
  DETAILED_OUTPUT_RETURNED: 'SYS.METRIC.OUTPUT.DETAILED_OUTPUT_RETURNED',
};

module.exports = {
  responseErrorReturned(error, mode) {
    logger.error({
      type: METRIC_TYPES.OUTPUT_ERROR_RETURNED,
      outputMode: mode,
      layer: error.layer,
      status: error.status,
      code: error.code,
      detail: error.message,
    })
  },
  responseReturned(response, mode, meta) {
    const infoLog = {
      type: METRIC_TYPES.OUTPUT_RETURNED,
      outputMode: mode,
      status: response.status,
    }
    if(meta) infoLog.duration = meta.publish();
    logger.info(infoLog);
    logger.debug({
      type: METRIC_TYPES.DETAILED_OUTPUT_RETURNED,
      body: JSON.stringify(response.body),
    });
  }
}