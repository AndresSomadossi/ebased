const { FaultHandled, Handled } = require('../utils/error');
const outputMetric = require('../metrics/output');
const mode = 'OUTPUT_EVENT_CONFIRMATION';

module.exports = {
  processingFinished: ({ body, status = 202 }, meta) => {
    outputMetric.responseReturned({ body, status }, mode, meta);
    return;
  },
  processingFinishedError: (error) => {
    if (!(error instanceof Handled))
      error = new FaultHandled(`${error.name}-${error.message}`, { code: 'UHANDLED_OUTPUT_FAULT', layer: mode, });
    outputMetric.responseErrorReturned(error, mode);
    throw JSON.stringify(error.get());
  },
}