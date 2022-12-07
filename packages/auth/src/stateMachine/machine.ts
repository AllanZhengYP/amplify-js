// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MachineState } from './MachineState';
import { v4 as uuid } from 'uuid';
import {
	EventConsumer,
	MachineContext,
	MachineEvent,
	StateMachineParams,
} from './types';
// TODO: Import from core once library build is resolved
import { HubClass } from '@aws-amplify/core/lib-esm/Hub';

export class Machine<
	ContextType extends MachineContext,
	EventType extends MachineEvent
> implements EventConsumer<EventType>
{
	private _name: string;
	private _states = new Map<string, MachineState<ContextType, EventType>>();
	private _context: ContextType;
	private _current: MachineState<ContextType, EventType>;
	public hub: HubClass;
	public hubChannel: string;

	constructor(params: StateMachineParams<ContextType, EventType>) {
		this._name = params.name;
		this._context = params.context;
		this.hub = new HubClass('auth-state-machine');
		this.hubChannel = `${this._name}-channel`;

		params.states
			.map(
				stateParams =>
					new MachineState({
						name: stateParams.name,
						transitions: stateParams.transitions,
						machineContext: this._context,
						machineManagerBroker: params.machineManagerBroker,
						hub: this.hub,
						hubChannel: this.hubChannel,
					})
			)
			.forEach(machineState => {
				this._states.set(machineState.name, machineState);
			});

		this._current = this._states.get(params.initial) || this._states[0];
	}

	getCurrentState() {
		return {
			// TODO: we can infer all the possible state names with some TS gymnastics
			currentState: this._current.name,
			context: { ...this._context },
		};
	}

	/**
	 * Receives an event for immediate processing
	 *
	 * @typeParam PayloadType - The type of payload received in current state
	 * @param event - The dispatched Event
	 */
	async accept(event: EventType) {
		event.id = uuid();
		const {
			nextState: nextStateName,
			newContext,
			effectsPromise,
		} = this._current.accept(event);
		const nextState = this._states.get(nextStateName);
		if (!nextState) {
			// TODO: handle invalid next state.
			throw new Error('TODO: handle invalid next state.');
		}
		this._current = nextState;
		if (newContext) {
			this._context = newContext;
		}
		await effectsPromise;
	}

	// /**
	//  * Returns the current state after previously queued events have been flushed
	//  */
	// async getCurrentState(): Promise<CurrentStateAndContext<ContextType, any>> {
	// 	let resolver: (
	// 		value:
	// 			| CurrentStateAndContext<ContextType, any>
	// 			| PromiseLike<CurrentStateAndContext<ContextType, any>>
	// 	) => void;
	// 	const awaiter = new Promise<CurrentStateAndContext<ContextType, any>>(
	// 		(resolve, _) => {
	// 			resolver = resolve;
	// 		}
	// 	);
	// 	const event: MachineEvent<MachineEventPayload> = {
	// 		name: 'current-state-request',
	// 		id: uuid(),
	// 		payload: {},
	// 		restingStates: [],
	// 	};

	// 	let cancelToken = this.hub.listen(this._eventChannel, hubEvent => {
	// 		if (
	// 			hubEvent.payload.data.event.id === event!.id &&
	// 			hubEvent.source === StateMachineHubEventName.CURRENT_STATE_REQUESTED
	// 		) {
	// 			// TODO: deep copy?
	// 			resolver({ currentState: this._current, context: this._context });
	// 			cancelToken();
	// 		}
	// 	});

	// 	this.hub.dispatch(
	// 		this._eventChannel,
	// 		{
	// 			event: StateMachineHubEventName.CURRENT_STATE_REQUESTED,
	// 			data: { event },
	// 		},
	// 		StateMachineHubEventName.CURRENT_STATE_REQUESTED
	// 	);
	// 	return await awaiter;
	// }

	// private async _queueProcessor() {
	// 	if (this._queue.length > 0) {
	// 		let currentEvent = this._queue.shift();

	// 		let cancelToken = this.hub.listen(this.hubChannel, hubEvent => {
	// 			if (
	// 				hubEvent.payload.data.event &&
	// 				hubEvent.payload.data.event.id == currentEvent!.id
	// 			) {
	// 				this._queueProcessor();
	// 				cancelToken();
	// 			}
	// 		});
	// 		this._processEvent(currentEvent!);
	// 	} else {
	// 		this._queueIdle = true;
	// 	}
	// }

	// protected async _processEvent(
	// 	event: MachineEvent<MachineEventPayload>
	// ): Promise<void> {
	// 	const validTransition = this._current.findTransition(event);
	// 	if (!validTransition) {
	// 		this._handleFailure(StateMachineHubEventName.NULL_TRANSITION, event);
	// 		return;
	// 	}
	// 	const checkGuards = this._checkGuards(validTransition, event);
	// 	if (!checkGuards) {
	// 		this._handleFailure(StateMachineHubEventName.STATE_GUARD_FAILURE, event);
	// 		return;
	// 	}

	// 	const nextState = this._states.get(validTransition.nextState);
	// 	if (!nextState) {
	// 		this._handleFailure(StateMachineHubEventName.NEXT_STATE_NOT_FOUND, event);
	// 		return;
	// 	}

	// 	this._current = nextState;

	// 	await this._enterState(validTransition, event!);
	// }

	// private async _enterState<PayloadType extends MachineEventPayload>(
	// 	transition: StateTransition<ContextType, PayloadType>,
	// 	event: MachineEvent<PayloadType>
	// ): Promise<void> {
	// 	this._invokeReducers<PayloadType>(transition, event);

	// 	this._invokeActions<PayloadType>(transition, event);
	// 	if (this._current?.invocation?.invokedMachine) {
	// 		this._current.invocation.invokedMachine.send(
	// 			this._current.invocation.event!
	// 		);
	// 	} else if (this._current?.invocation?.invokedPromise) {
	// 		await this._current.invocation.invokedPromise(this._context, event);
	// 	}
	// 	this._broadCastTransition<PayloadType>(transition, event);
	// }

	// private _checkGuards<PayloadType extends MachineEventPayload>(
	// 	transition: StateTransition<ContextType, PayloadType>,
	// 	event: MachineEvent<PayloadType>
	// ): boolean {
	// 	if (!transition.guards) return true;
	// 	for (let g = 0; g < transition.guards.length; g++) {
	// 		if (!transition.guards[g](this._context, event)) {
	// 			return false;
	// 		}
	// 	}
	// 	return true;
	// }

	// private _invokeReducers<PayloadType extends MachineEventPayload>(
	// 	transition: StateTransition<ContextType, PayloadType>,
	// 	event: MachineEvent<PayloadType>
	// ): void {
	// 	if (!transition.reducers) return;
	// 	for (let r = 0; r < transition.reducers.length; r++) {
	// 		this._context = transition.reducers[r](
	// 			this._copyContext(this._context),
	// 			event
	// 		);
	// 	}
	// }

	// private async _invokeActions<PayloadType extends MachineEventPayload>(
	// 	transition: StateTransition<ContextType, PayloadType>,
	// 	event: MachineEvent<PayloadType>
	// ): Promise<void> {
	// 	if (!transition.actions) return;
	// 	for (let r = 0; r < transition.actions.length; r++) {
	// 		transition.actions[r](this._context, event);
	// 	}
	// }

	// //TODO: validate states with uniqueness on name (otherwise a dupe will just be overridden in Map)
	// private _createStateMap(
	// 	states: MachineStateParams<ContextType, MachineEventPayload>[]
	// ): Map<string, MachineState<ContextType, MachineEventPayload>> {
	// 	return states.reduce(function (map, obj) {
	// 		map.set(obj.name, obj);
	// 		return map;
	// 	}, new Map<string, MachineState<ContextType, MachineEventPayload>>());
	// }

	// private _broadCastTransition<PayloadType extends MachineEventPayload>(
	// 	transition: StateTransition<ContextType, PayloadType>,
	// 	event: MachineEvent<PayloadType>
	// ): void {
	// 	this.hub.dispatch(
	// 		this.hubChannel,
	// 		{
	// 			event: StateMachineHubEventName.STATE_TRANSITION,
	// 			data: {
	// 				state: this._current?.name,
	// 				context: this._context,
	// 				transition,
	// 				event,
	// 			},
	// 		},
	// 		this._name
	// 	);
	// }

	// private _handleFailure<PayloadType extends MachineEventPayload>(
	// 	msg: StateMachineHubEventName,
	// 	event: MachineEvent<PayloadType>
	// ): void {
	// 	// event.completer!.complete(this.context);
	// 	this.hub.dispatch(
	// 		this.hubChannel,
	// 		{
	// 			event: msg,
	// 			data: {
	// 				state: this._current?.name,
	// 				context: this._context,
	// 				event,
	// 			},
	// 		},
	// 		this._name
	// 	);
	// }

	// private _copyContext<T extends object>(source: T): T {
	// 	return JSON.parse(JSON.stringify(source));
	// }
}
