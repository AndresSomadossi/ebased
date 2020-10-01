const inputMetric = require('../../_metric/input');
const { Metadata } = require('../../_helper/metadata');
const mode = 'INPUT_COMMAND_INVOKE';

module.exports = {
  request: (command = {}, context = {}) => {
    const rawCommand = command;
    const commandMeta = new Metadata(context, command.meta);
    delete command.meta;
    inputMetric.input(command, context, mode, commandMeta.get());
    return { commandPayload: command, commandMeta, rawCommand };
  }
}