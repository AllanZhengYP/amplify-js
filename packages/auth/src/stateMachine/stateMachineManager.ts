import {
	EventConsumer,
	MachineContext,
	MachineEvent,
	MachineEventPayload,
} from './types';
import { Machine } from './machine';

export class MachineManager<
	Machines extends Array<Machine<MachineContext, EventTypes>>
> implements EventConsumer<MachineEventPayload>
{
	private _internalEvents;

	constructor(machines: [...Machines]) {}

	accept(event: MachineEvent): Promise<void> {}
}

class MachineManagerInternalEventQueue {
	private _queue: MachineEvent<MachineEventPayload>[] = [];

	send() {}
}
