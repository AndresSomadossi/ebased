const inputMetric = require('../../_metric/input');
const { Metadata } = require('../../_helper/metadata');
const { FaultHandled } = require('../../util/error');
const mode = 'INPUT_COMMAND_API';

module.exports = {
  request: async (command = {}, context = {}) => {
    try {
      const rawCommand = command;
      if (command.headers.tracedDuration) command.headers.tracedDuration = JSON.parse(command.headers.tracedDuration);
      const commandMeta = new Metadata(context, command.headers);
      const commandPayload = getPayload(command);
      inputMetric.input(commandPayload, context, mode, commandMeta.get());
      return { commandPayload, commandMeta, rawCommand };
    } catch (error) {
      throw new FaultHandled(error.message, { code: 'BAD_INPUT_PROTOCOL_ERROR', layer: mode });
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