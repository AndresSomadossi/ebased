const { Metadata } = require('../utils/metadata');
const inputMetric = require('../metrics/input');
const mode = 'INPUT_COMMAND_INVOKE';

module.exports = {
  request: (command = {}, context) => {
    const commandMeta = new Metadata(command.meta);
    delete command.meta;
    inputMetric.input(command, context, mode, commandMeta.get());
    return { commandPayload: command, commandMeta };
  }
}