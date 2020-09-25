const { Metadata } = require('../../util/metadata');
const inputMetric = require('../../metric/input');
const mode = 'INPUT_COMMAND_API';

module.exports = {
  request: (command = {}, context) => {
    try {
      const commandMeta = new Metadata(context, command.meta);
      delete command.meta;
      if (typeof command.body === 'string') command.body = JSON.parse(command.body);
      inputMetric.input(command, context, mode, commandMeta.get());
      return { commandPayload: command, commandMeta };
    } catch (error) {
      throw new FaultHandled(error.message, { code: 'BAD_INPUT_PROTOCOL_FAULT', layer: mode });
    }
  }
}