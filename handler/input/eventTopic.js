const { Metadata } = require('../../util/metadata');
const inputMetric = require('../../metric/input');
const mode = 'INPUT_EVENT_TOPIC';

module.exports = {
  eventReceived: (event = {}, context) => {
    const { id, source, time, specversion, tracedDuration, clientId, trackingTag } = event.Records[0].Sns.MessageAttributes;
    const eventPayload = JSON.parse(event.Records[0].Sns.Message);
    const eventMeta = new Metadata({
      id: id && id.Value,
      source: source && source.Value,
      time: time && parseInt(time.Value),
      specversion: specversion && specversion.Value,
      tracedDuration: tracedDuration && JSON.parse(tracedDuration.Value),
      clientId: clientId && clientId.Value,
      trackingTag: trackingTag && trackingTag.Value,
    });
    inputMetric.input(event, context, mode, eventMeta.get());
    return { eventPayload: eventPayload, eventMeta };
  }
}