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

		// TODO: validate FSM
		params.states
			.map(
				stateParams =>
					new MachineState({
						name: stateParams.name,
						transitions: stateParams.transitions,
						machineContext: this._copyContext(this._context),
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

	private _copyContext<T extends object>(source: T): T {
		return JSON.parse(JSON.stringify(source));
	}
}
