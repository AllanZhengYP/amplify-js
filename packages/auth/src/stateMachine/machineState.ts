// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { StateMachineHubEventName } from '../constants/StateMachineHubEventName';
import { HubClass } from '@aws-amplify/core/lib-esm/Hub';
import {
	MachineContext,
	MachineEvent,
	StateTransition,
	MachineState as IMachineState,
	MachineStateParams,
	MachineStateEventResponse,
	EventBroker,
} from './types';

interface MachineStateClassParams<
	ContextType extends MachineContext,
	EventType extends MachineEvent
> extends MachineStateParams<ContextType, EventType> {
	machineContext: ContextType;
	machineManagerBroker: EventBroker<EventType>;
	hub: HubClass;
	hubChannel: string;
}

/**
 * @internal
 */
export class MachineState<
	ContextType extends MachineContext,
	EventType extends MachineEvent
> implements IMachineState<ContextType, EventType>
{
	name: string;
	transitions: StateTransition<ContextType, EventType>[];
	private readonly machineContext: ContextType; // Use readonly to prevent re-assign of context reference
	private readonly machineManagerBroker: EventBroker<EventType>;
	private readonly hub: HubClass;
	private readonly hubChannel: string;

	constructor(props: MachineStateClassParams<ContextType, EventType>) {
		this.name = props.name;
		this.transitions = props.transitions ?? [];
		this.machineContext = props.machineContext;
		this.machineManagerBroker = props.machineManagerBroker;
		this.hub = props.hub;
		this.hubChannel = props.hubChannel;
	}

	accept(event: EventType): MachineStateEventResponse<ContextType> {
		const transition = this.getValidTransition(event);
		const nextState = transition?.nextState ?? this.name;
		let newContext = this.machineContext;
		transition?.reducers?.forEach(reducer => {
			newContext = reducer(newContext, event);
		});
		const response: MachineStateEventResponse<ContextType> = {
			nextState,
		};
		if (newContext !== this.machineContext) {
			response.newContext = newContext;
		}
		if ((transition?.effects ?? []).length > 0) {
			const promiseArr = transition!.effects!.map(effect =>
				effect(newContext, event, this.machineManagerBroker)
			);
			// TODO: Concurrently running effects causes new events emitted in
			// undetermined order. Should we run them in order?
			response.effectsPromise = Promise.all(
				promiseArr
			) as unknown as Promise<void>;
		}
		return response;
	}

	private getValidTransition(
		event: EventType
	): StateTransition<ContextType, EventType> | undefined {
		const validTransitions = this.transitions
			.filter(transition => transition.event === event.name)
			.filter(transition => {
				const blocked = transition?.guards?.some(guard =>
					guard(this.machineContext, event)
				);
				return !blocked;
			});
		if (validTransitions.length === 0) {
			this.hub.dispatch(this.hubChannel, {
				event: StateMachineHubEventName.NULL_TRANSITION,
				data: {
					state: this.name,
					context: this.machineContext,
					event,
				},
			});
			return undefined; // TODO: should we do nothing on unknown event?
		} else if (validTransitions.length > 1) {
			throw new Error('Got more than 1 valid transitions');
		} else {
			return validTransitions[0];
		}
	}
}
