const outputMetric = require('../../_metric/output');
const { FaultHandled } = require('../../util/error');
const mode = 'OUTPUT_BATCH_EVENT_CONFIRMATION';

module.exports = {
  processingFinished: ({ body = {}, status = 202 } = {}, meta, rawEvent) => {
    outputMetric.responseReturned({ body, status }, mode, meta);
    return { result: body, rawEvent };
  },
  processingFinishedError: (error, meta, rawEvent) => {
    error = FaultHandled.captureUnhanlded(error, { code: 'UHANDLED_OUTPUT_FAULT', layer: mode });
    outputMetric.responseErrorReturned(error, mode, meta);
    return { result: error, rawEvent };
  },
}