const outputMetric = require('../../_metric/output');
const { FaultHandled } = require('../../util/error');
const mode = 'OUTPUT_EVENT_CONFIRMATION';

module.exports = {
  processingFinished: ({ body = {}, status = 202 } = {}, meta) => {
    outputMetric.responseReturned({ body, status }, mode, meta);
    return;
  },
  processingFinishedError: (error, meta) => {
    error = FaultHandled.captureUnhanlded(error, { code: 'UHANDLED_OUTPUT_FAULT', layer: mode });
    outputMetric.responseErrorReturned(error, mode, meta);
    throw JSON.stringify(error.get());
  },
}