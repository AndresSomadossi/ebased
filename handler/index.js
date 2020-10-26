const Schema = require('schemy');
const { FaultHandled } = require('../util/error');

module.exports = {
  commandMapper: async (input = {}, inputMode = {}, domain, outputMode = {}) => {
    const { command, context } = input;
    const { request } = inputMode;
    const { response, responseError } = outputMode;
    const cmdParams = { command, context, request, domain, response, responseError };
    const cmdSchema = new Schema({
      command: { type: Object, required: true },
      context: { type: Object, required: true },
      request: { type: Function, required: true },
      domain: { type: Function, required: true },
      response: { type: Function, required: true },
      responseError: { type: Function, required: true },
    });
    const validateResult = await validate(cmdParams, cmdSchema, responseError);
    if (validateResult !== true) return validateResult;

    const requestResult = await request(command, context).catch(responseError);
    if (!requestResult.commandPayload) return requestResult;
    const { commandPayload, commandMeta, rawCommand } = requestResult;
    return await domain(commandPayload, commandMeta, rawCommand)
      .then(r => response(r, commandMeta))
      .catch((e) => responseError(e, commandMeta));
  },

  eventMapper: async (input = {}, inputMode = {}, domain, outputMode = {}) => {
    const { event, context } = input;
    const { eventReceived } = inputMode;
    const { processingFinished, processingFinishedError } = outputMode;
    const eventParams = { event, context, eventReceived, domain, processingFinished, processingFinishedError };
    const eventSchema = new Schema({
      event: { type: Object, required: true },
      context: { type: Object, required: true },
      eventReceived: { type: Function, required: true },
      domain: { type: Function, required: true },
      processingFinished: { type: Function, required: true },
      processingFinishedError: { type: Function, required: true },
    });
    await validate(eventParams, eventSchema, processingFinishedError);

    const { eventPayload, eventMeta, rawEvent } = await eventReceived(event, context).catch(processingFinishedError);
    await domain(eventPayload, eventMeta, rawEvent)
      .then(r => processingFinished(r, eventMeta))
      .catch(e => processingFinishedError(e, eventMeta))
  },

  batchEventMapper: async (input = {}, inputMode = {}, domain, outputMode = {}, retryStrategy) => {
    const { events, context } = input;
    const { batchEventReceived, commitEvent, retryEvent } = inputMode;
    const { processingFinished, processingFinishedError } = outputMode;
    const batchEventParams = { events, context, batchEventReceived, commitEvent, retryEvent, domain, processingFinished, processingFinishedError };
    const batchEventSchema = new Schema({
      events: { type: Object, required: true },
      context: { type: Object, required: true },
      batchEventReceived: { type: Function, required: true },
      commitEvent: { type: Function, required: true },
      retryEvent: { type: Function, required: true },
      domain: { type: Function, required: true },
      processingFinished: { type: Function, required: true },
      processingFinishedError: { type: Function, required: true },
    });
    await validate(batchEventParams, batchEventSchema, processingFinishedError);
    const domainResults = await Promise.all(events.Records.map(async event => {
      const { eventPayload, eventMeta, rawEvent } = await batchEventReceived(event, context).catch(processingFinishedError);
      return await domain(eventPayload, eventMeta, rawEvent)
        .then(r => processingFinished(r, eventMeta, rawEvent))
        .catch(e => processingFinishedError(e, eventMeta, rawEvent))
    }));
    // If there are no errors, return.
    if (!domainResults.some(d => d.result instanceof Error)) return;
    // At least one Error
    if (!retryStrategy) retryStrategy = () => 0;
    const failedBatchExecution = await Promise.all(domainResults.map(async domainResult => {
      const { result, rawEvent } = domainResult;
      // Message delay strategy
      if (result instanceof Error) return retryEvent(rawEvent, retryStrategy);
      // Force message deletation
      else return commitEvent(rawEvent);
    })).catch(e => { throw new FaultHandled(e, { code: 'BATCH_FAULT', layer: 'MAPPER' }); });
    throw new FaultHandled(failedBatchExecution, { code: 'BATCH_FAULT', layer: 'MAPPER' });
  },
}

const validate = async (params, schema, errorOutput) => {
  return Schema.validate(params, schema).catch(e => {
    e = new FaultHandled(e, { code: 'BAD_MAPPER_INPUT_FAULT', layer: 'MAPPER' });
    if (typeof errorOutput === 'function') return errorOutput(e);
    return e.get();
  });
}