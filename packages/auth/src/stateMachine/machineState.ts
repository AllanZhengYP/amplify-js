// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { HubClass } from '@aws-amplify/core/lib-esm/Hub';
import {
	MachineContext,
	MachineEvent,
	MachineEventPayload,
	StateTransition,
	MachineState as IMachineState,
	MachineStateParams,
	MachineStateEventResponse,
	Dispatcher,
} from './types';

interface MachineStateClassParams<
	ContextType extends MachineContext,
	PayloadType extends MachineEventPayload
> extends MachineStateParams<ContextType, PayloadType> {
	machineContext: ContextType;
	machineManagerDispatcher: Dispatcher<PayloadType>;
	hub: HubClass;
	hubChannel: string;
}

/**
 * @internal
 */
export class MachineState<
	ContextType extends MachineContext,
	PayloadType extends MachineEventPayload
> implements IMachineState<ContextType, PayloadType>
{
	name: string;
	transitions: StateTransition<ContextType, PayloadType>[];
	private readonly machineContext: ContextType; // Use readonly to prevent re-assign of context reference
	private readonly machineManagerDispatcher: Dispatcher<PayloadType>;

	constructor(props: MachineStateClassParams<ContextType, PayloadType>) {
		this.name = props.name;
		this.transitions = props.transitions ?? [];
		this.machineContext = props.machineContext;
		this.machineManagerDispatcher = props.machineManagerDispatcher;
	}

	send(
		event: MachineEvent<PayloadType>
	): MachineStateEventResponse<ContextType> {
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
				effect(newContext, event, this.machineManagerDispatcher)
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
		event: MachineEvent<PayloadType>
	): StateTransition<ContextType, PayloadType> | undefined {
		const validTransitions = this.transitions
			.filter(transition => transition.event === event.name)
			.filter(transition => {
				return transition?.guards?.every(
					guard => !guard(this.machineContext, event)
				);
			});
		if (validTransitions.length === 0) {
			return undefined; // TODO: should we do nothing on unknown event?
		} else if (validTransitions.length > 1) {
			throw new Error('Got more than 1 valid transitions');
		} else {
			return validTransitions[0];
		}
	}
}
