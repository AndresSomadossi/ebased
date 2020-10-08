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
  batchEventMapper: async (input = {}, inputMode = {}, domain, outputMode = {}) => {
    const { events, context } = input;
    const { bachtEventReceived } = inputMode;
    const { processingFinished, processingFinishedError } = outputMode;
    const batchEventParams = { events, context, bachtEventReceived, domain, processingFinished, processingFinishedError };
    const batchEventSchema = new Schema({
      events: { type: Object, required: true },
      context: { type: Object, required: true },
      bachtEventReceived: { type: Function, required: true },
      domain: { type: Function, required: true },
      processingFinished: { type: Function, required: true },
      processingFinishedError: { type: Function, required: true },
    });
    await validate(batchEventParams, batchEventSchema, processingFinishedError);

    await Promise.all(events.Records.map(async event => {
      const { eventPayload, eventMeta, rawEvent } = await bachtEventReceived(event, context).catch(processingFinishedError);
      await domain(eventPayload, eventMeta, rawEvent)
        .then(r => processingFinished(r, eventMeta))
        .catch(e => processingFinishedError(e, eventMeta))
    }))
    return { body: { eventsProcessed: events.Records.length } }
  },
}

const validate = async (params, schema, errorOutput) => {
  return Schema.validate(params, schema).catch(e => {
    e = new FaultHandled(e, { code: 'BAD_MAPPER_INPUT_FAULT', layer: 'MAPPERS' });
    if (typeof errorOutput === 'function') return errorOutput(e);
    return e.get();
  })
}