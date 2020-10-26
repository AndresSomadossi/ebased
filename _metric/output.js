const logger = require('../_helper/logger');

const METRIC_TYPES = {
  OUTPUT_ERROR_RETURNED: 'SYS.METRIC.OUTPUT.OUTPUT_ERROR_RETURNED',
  OUTPUT_RETURNED: 'SYS.METRIC.OUTPUT.OUTPUT_RETURNED',
  DETAILED_OUTPUT_RETURNED: 'SYS.LOG.OUTPUT.DETAILED_OUTPUT_RETURNED',
};

module.exports = {
  responseErrorReturned(error, mode, meta) {
    logger.error({
      type: METRIC_TYPES.OUTPUT_ERROR_RETURNED,
      outputMode: mode,
      layer: error.layer,
      status: error.status,
      code: error.code,
      detail: error.message,
      metaParams: (meta) ? meta.get() : null,
      duration: (meta) ? meta.publish() : null
    }, { color: ['FgRed', 'Reverse'] });
  },
  responseReturned(response, mode, meta) {
    logger.info({
      type: METRIC_TYPES.OUTPUT_RETURNED,
      outputMode: mode,
      status: response.status,
      metaParams: (meta) ? meta.get() : null,
      duration: (meta) ? meta.publish() : null
    }, { color: ['FgGreen', 'Reverse'] });
    logger.debug({
      type: METRIC_TYPES.DETAILED_OUTPUT_RETURNED,
      body: JSON.stringify(response.body),
    }, { color: ['FgGreen'] });
  }
}