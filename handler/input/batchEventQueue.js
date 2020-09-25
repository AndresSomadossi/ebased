const { Metadata } = require('../../util/metadata');
const { FaultHandled } = require('../../util/error');
const inputMetric = require('../../metric/input');
const mode = 'INPUT_BATCH_EVENT_QUEUE';

module.exports = {
  batchIterator: async (events = {}, context, domain, processingFinished) => {
    await Promise.all(events.Records.map(async event => {
      const { eventPayload, eventMeta } = eventReceived(event, context);
      const domainReturn = await domain( eventPayload, eventMeta);  
      return processingFinished(domainReturn, eventMeta);
    }));
    return { body: { eventsProcessed: events.Records.length } }
  },
}

function eventReceived(event = {}, context = {}) {
  try {
    const { id, source, time, specversion, tracedDuration, clientId, trackingTag } = event.messageAttributes;
    const eventPayload = JSON.parse(event.body);
    const eventMeta = new Metadata(context, {
      traceId: event.attributes.AWSTraceHeader,
      id: id && id.stringValue,
      source: source && source.stringValue,
      time: time && parseInt(time.stringValue),
      specversion: specversion && specversion.stringValue,
      tracedDuration: tracedDuration && JSON.parse(tracedDuration.stringValue),
      clientId: clientId && clientId.stringValue,
      trackingTag: trackingTag && trackingTag.stringValue,
    });
    inputMetric.input(event, context, mode, eventMeta.get());
    return { eventPayload: eventPayload, eventMeta };
  } catch (error) {
    throw new FaultHandled(error.message, { code: 'BAD_INPUT_PROTOCOL_FAULT', layer: mode })
  }
}