// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { HubClass } from '@aws-amplify/core/lib/Hub';
import {
	ImmediateStateTransition,
	MachineContext,
	MachineEvent,
	MachineEventPayload,
	MachineStateParams,
	StateTransition,
} from './types';

export interface HandleEventOptions {
	hub: HubClass;
	hubChannel: string;
}

export class MachineState<
	ContextType extends MachineContext,
	PayloadType extends MachineEventPayload
> {
	name: string;
	transitions?: StateTransition<ContextType, PayloadType>[];
	immdiateTransitions?: ImmediateStateTransition<ContextType>[];
	constructor(params: MachineStateParams<ContextType, PayloadType>) {
		this.name = params.name;
		this.transitions = params.transitions;
		this.immdiateTransitions = params.immediateTransitions;
	}

	async handleEvent(
		event: MachineEvent<PayloadType>,
		machineContext: ContextType,
		options: HandleEventOptions
	): Promise<string> {
		const transition = this.pickValidEventTransition(
			event,
			machineContext,
			this.transitions
		);
		if (!transition) {
			//TODO
			console.error('TODO: no valid transition');
			throw new Error('TODO: no valid transition');
		}
		if (transition?.reducers) {
			//TODO
			console.log('TODO: handleEvent reducers');
		}
		if (transition?.actions) {
			// TODO
			console.log('TODO: handleEvent actions');
		}
		return transition.nextState;
	}

	async handleTransit(
		machineContext: ContextType,
		options: HandleEventOptions
	): Promise<string | null> {
		const transition = this.pickValidImmediateTransition(
			machineContext,
			this.immdiateTransitions
		);
		if (transition?.reducers) {
			//TODO
			console.log('TODO: handleTransit reducers');
		}
		if (transition?.actions) {
			// TODO
			console.log('TODO: handleTransit actions');
		}
		return transition?.nextState ?? null;
	}

	private pickValidEventTransition(
		event: MachineEvent<PayloadType>,
		machineContext: ContextType,
		transitions: StateTransition<ContextType, PayloadType>[] = []
	): StateTransition<ContextType, PayloadType> | undefined {
		const validTransitions = transitions.filter(transition => {
			return transition?.guards?.every(guard => !guard(machineContext, event));
		});
		if (validTransitions.length === 0) {
			return undefined;
		} else if (validTransitions.length > 1) {
			//TODO
			throw new Error('Got more than 1 valid transitions');
		} else {
			return validTransitions[0];
		}
	}

	private pickValidImmediateTransition(
		machineContext: ContextType,
		transitions: ImmediateStateTransition<ContextType>[] = []
	): ImmediateStateTransition<ContextType> | undefined {
		const validTransitions = transitions.filter(transition => {
			return transition?.guards?.every(guard => !guard(machineContext));
		});
		if (validTransitions.length === 0) {
			return undefined;
		} else if (validTransitions.length > 1) {
			//TODO
			throw new Error('Got more than 1 valid transitions');
		} else {
			return validTransitions[0];
		}
	}
}
