const inputMetric = require('../../_metric/input');
const { Metadata } = require('../../_helper/metadata');
const mode = 'INPUT_EVENT_INVOKE';

module.exports = {
  eventReceived: (event = {}, context = {}) => {
    const rawEvent = event;
    const eventMeta = new Metadata(context, event.meta);
    delete event.meta;
    inputMetric.input(event, context, mode, eventMeta.get());
    return { eventPayload: event, eventMeta, rawEvent };
  }
}