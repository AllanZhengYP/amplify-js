// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MachineState } from './MachineState';
import { v4 as uuid } from 'uuid';
import {
	EventConsumer,
	MachineContext,
	MachineEvent,
	StateMachineParams,
	MachineStateParams,
	StateTransitions,
} from './types';
// TODO: Import from core once library build is resolved
import { HubClass } from '@aws-amplify/core/lib-esm/Hub';

/**
 * A Finite state machine implementation.
 * @typeParam ContextType - The type of the enclosing Machine's context.
 * @typeParam EventTypes - The type of all the possible events. Expecting a union of {@link MachineEvent} types.
 * @typeParam StateNames - The type of all the state names. Expecting a union of strings.
 */
export class Machine<
	ContextType extends MachineContext,
	EventTypes extends MachineEvent,
	StateNames extends string
> implements EventConsumer<EventTypes>
{
	private _name: string;
	private _states: Record<
		StateNames,
		MachineState<ContextType, EventTypes, StateNames>
	>;
	private _context: ContextType;
	private _current: MachineState<ContextType, EventTypes, StateNames>;
	public hub: HubClass;
	public hubChannel: string;

	constructor(params: StateMachineParams<ContextType, EventTypes, StateNames>) {
		this._name = params.name;
		this._context = params.context;
		this.hub = new HubClass('auth-state-machine');
		this.hubChannel = `${this._name}-channel`;

		// TODO: validate FSM
		// @ts-ignore TODO: make TSC happy
		this._states = Object.fromEntries(
			Object.entries(params.states).map(([stateName, transitions]) => [
				stateName as StateNames,
				new MachineState({
					name: stateName,
					transitions: transitions as StateTransitions<
						ContextType,
						EventTypes,
						StateNames
					>,
					// Use closure to share reference of machine context across the states
					machineContextGetter: () => this._context,
					machineManager: params.machineManager,
					hub: this.hub,
					hubChannel: this.hubChannel,
				}),
			])
		);

		this._current =
			this._states[params.initial] ||
			this._states[Object.keys(params.states)[0]];
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
	 * @param event - The dispatched Event.
	 */
	async accept(event: EventTypes) {
		event.id = uuid();
		const {
			nextState: nextStateName,
			newContext,
			effectsPromise,
		} = this._current.accept(event);
		const nextState = this._states[nextStateName];
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
