const { FaultHandled } = require('../../util/error');
const outputMetric = require('../../metric/output');
const mode = 'OUTPUT_EVENT_CONFIRMATION';

module.exports = {
  processingFinished: ({ body, status = 202 }, meta) => {
    outputMetric.responseReturned({ body, status }, mode, meta);
    return;
  },
  processingFinishedError: (error) => {
    error = FaultHandled.captureUnhanlded(error, { code: 'UHANDLED_OUTPUT_FAULT', layer: mode });
    outputMetric.responseErrorReturned(error, mode);
    throw JSON.stringify(error.get());
  },
}