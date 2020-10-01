const inputMetric = require('../../_metric/input');
const { Metadata } = require('../../_helper/metadata');
const { FaultHandled } = require('../../util/error');
const mode = 'INPUT_COMMAND_API';

module.exports = {
  request: (command = {}, context) => {
    try {
      const rawCommand = command;
      if (command.headers.tracedDuration) command.headers.tracedDuration = JSON.parse(command.headers.tracedDuration);
      const commandMeta = new Metadata(context, command.headers);
      if (typeof command.body === 'string') command.body = JSON.parse(command.body);
      inputMetric.input(command, context, mode, commandMeta.get());
      return { commandPayload: command, commandMeta, rawCommand };
    } catch (error) {
      throw new FaultHandled(error.message, { code: 'BAD_INPUT_PROTOCOL_FAULT', layer: mode });
    }
  }
}