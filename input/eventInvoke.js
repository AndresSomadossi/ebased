const { Metadata } = require('../utils/metadata');
const inputMetric = require('../metrics/input');
const mode = 'INPUT_EVENT_INVOKE';


module.exports = {
  eventReceived: (event = {}, context) => {
    const eventMeta = new Metadata(event.meta);
    delete event.meta;
    inputMetric.input(event, context, mode, eventMeta.get());
    return { eventPayload: event, eventMeta };
  }
}