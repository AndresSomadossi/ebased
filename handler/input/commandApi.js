const inputMetric = require('../../_metric/input');
const { Metadata } = require('../../_helper/metadata');
const { FaultHandled } = require('../../util/error');
const mode = 'INPUT_COMMAND_API';

module.exports = {
  request: async (command = {}, context = {}) => {
    try {
      const rawCommand = command;
      const metaMapping = {
        tracedDuration: (command.headers['traced-duration']) ?  JSON.parse(command.headers['traced-duration']): {},
        clientId: command.headers['client-id'],
        trackingTag: command.headers['tracking-tag'],
        id: command.headers.id,
        source: command.headers.source,
        time: command.headers.time,
        type: command.headers.type,
        specversion: command.headers.specversion,
      };
      const commandMeta = new Metadata(context, metaMapping);
      const commandPayload = getPayload(command);
      inputMetric.input(commandPayload, context, mode, commandMeta.get());
      return { commandPayload, commandMeta, rawCommand };
    } catch (error) {
      throw new FaultHandled(error.message, { code: 'BAD_INPUT_PROTOCOL_FAULT', layer: mode });
    }
  }
}

const getPayload = (command) => {
  const { queryStringParameters, pathParameters, stageVariables, body } = command;
  return {
    ...queryStringParameters,
    ...pathParameters,
    ...stageVariables,
    ...JSON.parse(body),
  }
}