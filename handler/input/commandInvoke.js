const { Metadata } = require('../../util/metadata');
const inputMetric = require('../../metric/input');
const mode = 'INPUT_COMMAND_INVOKE';

module.exports = {
  request: (command = {}, context = {}) => {
    const commandMeta = new Metadata(context, command.meta);
    delete command.meta;
    inputMetric.input(command, context, mode, commandMeta.get());
    return { commandPayload: command, commandMeta };
  }
}