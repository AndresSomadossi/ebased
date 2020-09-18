const { Metadata } = require('../../util/metadata');
const inputMetric = require('../../metric/input');
const mode = 'API_GATEWAY_INVOKE';

module.exports = {
  request: (command = {}, context) => {
    const commandMeta = new Metadata(context, command.meta);
	delete command.meta;
	// Support api gateway events
	if (typeof command.body === 'string') {
	  command.body = JSON.parse(command.body);
	}
    inputMetric.input(command, context, mode, commandMeta.get());
    return { commandPayload: command, commandMeta };
  }
}