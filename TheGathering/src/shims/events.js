import * as eventsModule from "/Users/banhvantranphat/tn/Gather/node_modules/events/events.js";

// Handle diverse export scenarios (Default export vs Namespace)
const EventEmitter = eventsModule.default || eventsModule.EventEmitter || eventsModule;

export { EventEmitter };
export default EventEmitter;
