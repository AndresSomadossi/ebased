module.exports = {
  commandMapper: async ({ command, context }, inputMode, domain, outputMode) => {
    const { request } = inputMode;
    const { response, responseError } = outputMode;
    const requestResult = await request(command, context).catch(responseError);
    if (!requestResult.commandPayload) return requestResult;
    const { commandPayload, commandMeta, rawCommand } = requestResult;
    return await domain(commandPayload, commandMeta, rawCommand)
      .then(r => response(r))
      .catch((e) => responseError(e, commandMeta));
  },
  eventMapper: async ({ event, context }, inputMode, domain, outputMode) => {
    const { eventReceived } = inputMode;
    const { processingFinished, processingFinishedError } = outputMode;
    const { eventPayload, eventMeta } = await eventReceived(event, context).catch(processingFinishedError);
    await domain(eventPayload, eventMeta)
      .then(r => processingFinished(r, eventMeta))
      .catch(e => processingFinishedError(e, eventMeta))
  },
  batchEventMapper: async ({ events, context }, inputMode, domain, outputMode) => {
    const { eventReceived } = inputMode;
    const { processingFinished, processingFinishedError } = outputMode;
    await Promise.all(events.Records.map(async event => {
      const { eventPayload, eventMeta, rawEvent } = await eventReceived(event, context).catch(processingFinishedError);
      await domain(eventPayload, eventMeta, rawEvent)
        .then(r => processingFinished(r, eventMeta))
        .catch(e => processingFinishedError(e, eventMeta))
    }))
    return { body: { eventsProcessed: events.Records.length } }
  },
}