const inputMetric = require('../../_metric/input');
const { Metadata } = require('../../_helper/metadata');
const { FaultHandled } = require('../../util/error');
const mode = 'INPUT_BATCH_EVENT_QUEUE';

module.exports = {
  eventReceived: async (event = {}, context = {}) => {
    try {
      const rawEvent = event;
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
      return { eventPayload, eventMeta, rawEvent };
    } catch (error) {
      throw new FaultHandled(error.message, { code: 'BAD_INPUT_PROTOCOL_ERROR', layer: mode });
    }
  }
}