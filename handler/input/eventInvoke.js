const inputMetric = require('../../_metric/input');
const { Metadata } = require('../../_helper/metadata');
const { FaultHandled } = require('../../util/error');
const mode = 'INPUT_EVENT_INVOKE';

module.exports = {
  eventReceived: async (event = {}, context = {}) => {
    try {
      const rawEvent = event;
      const eventMeta = new Metadata(context, event.meta);
      delete event.meta;
      inputMetric.input(event, context, mode, eventMeta.get());
      return { eventPayload: event, eventMeta, rawEvent };
    } catch (error) {
      throw new FaultHandled(error.message, { code: 'BAD_INPUT_PROTOCOL_FAULT', layer: mode });
    }
  }
}