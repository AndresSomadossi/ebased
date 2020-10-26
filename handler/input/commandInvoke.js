const inputMetric = require('../../_metric/input');
const { Metadata } = require('../../_helper/metadata');
const { FaultHandled } = require('../../util/error');
const mode = 'INPUT_COMMAND_INVOKE';

module.exports = {
  request: async (command = {}, context = {}) => {
    try {
      const rawCommand = command;
      const commandMeta = new Metadata(context, command.meta);
      delete command.meta;
      inputMetric.input(command, context, mode, commandMeta.get());
      return { commandPayload: command, commandMeta, rawCommand };
    } catch (error) {
      throw new FaultHandled(error.message, { code: 'BAD_INPUT_PROTOCOL_FAULT', layer: mode });
    }
  }
}