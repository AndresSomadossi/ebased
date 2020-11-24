const Schema = require('schemy');
const { FaultHandled } = require('../util/error');

module.exports = {
  /**
   * Validates input and output from your handler, calls the domain and keep trace of your flow
   * It will call your response callback if no errors are found, and your responseError callback otherwise
   * 
   * Use this mapper whenever your code executes via: Invoke or API Gateway
   * 
   * @param {Object<{command, context}>} input Lambda input, requires command and context.
   * @param {Object<{request}>} inputMode The event validation method for the command and context.
   * @param {Function} domain The main logic of your lambda. It will receive commandPayload, commandMeta and rawCommand as params.
   * @param {Object<{response, responseError}>} outputMode Two functions to handle the output of your lambda, one for success other for error.
   */
  commandMapper: async ({ command, context } = {}, { request } = {}, domain, { response, responseError } = {}) => {
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

  /**
   * Validates input and output from your handler, calls the domain and keep trace of your flow
   * It will call your response callback if no errors are found, and your responseError callback otherwise
   * 
   * Use this mapper whenever your code executes via events without batch such as SNS, S3, Event Bridge
   * 
   * @param {Object<{event, context}>} input Lambda input, requires event and context.
   * @param {Object<{eventReceived}>} inputMode Object with an eventReceived function to handle the input.
   * @param {Function} domain The main logic of your lambda. It will be called passing eventPayload, eventMeta and rawEvent as params.
   * @param {Object<{processingFinishedError, processingFinishedError}>} outputMode An object with to callbacks one in case your domain success and one in case an error is caught.
   */
  eventMapper: async ({ event, context } = {}, { eventReceived } = {}, domain, { processingFinished, processingFinishedError } = {}) => {
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
      .catch(e => processingFinishedError(e, eventMeta));
  },

  /**
   * Validates input and output from your handler, calls the domain and keep trace of your flow
   * It will call your response callback if no errors are found, and your responseError callback otherwise
   * 
   * Use this mapper whenever your code executes via events with batch events such as SQS
   * 
   * @param {Object<{event, context}>} input Lambda input, requires event and context.
   * @param {Object<{batchEventReceived, commitEvent, retryEvent}>} inputMode Object with an eventReceived function to handle the input.
   * @param {Function} domain The main logic of your lambda. It will be called passing eventPayload, eventMeta and rawEvent as params.
   * @param {Object<{processingFinishedError, processingFinishedError}>} outputMode An object with to callbacks one in case your domain success and one in case an error is caught.
   * @param {Function} retryStrategy A method defining the retry strategy, if nothing passed it will default to a function returning 0.
   */
  batchEventMapper: async ({ events, context } = {}, { batchEventReceived, commitEvent, retryEvent } = {}, domain, { processingFinished, processingFinishedError } = {}, retryStrategy) => {
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