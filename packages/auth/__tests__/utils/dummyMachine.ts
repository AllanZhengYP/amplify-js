// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Machine } from '../../src/stateMachine/machine';
import { EventBroker, StateTransition } from '../../src/stateMachine/types';
import {
	DummyContext,
	Events,
	state1Name,
	state2Name,
	state3Name,
} from './dummyEventsAndTypes';

export function dummyMachine(params: {
	initialContext: DummyContext;
	stateOneTransitions?: StateTransition<DummyContext, Events>[];
	stateTwoTransitions?: StateTransition<DummyContext, Events>[];
	stateThreeTransitions?: StateTransition<DummyContext, Events>[];
	machineManagerBroker?: EventBroker<Events>;
}): Machine<DummyContext, Events> {
	return new Machine({
		name: 'DummyMachine',
		context: params.initialContext,
		initial: state1Name,
		machineManagerBroker: params.machineManagerBroker ?? { dispatch: () => {} },
		states: [
			{
				name: state1Name,
				transitions: params.stateOneTransitions,
			},
			{
				name: state2Name,
				transitions: params.stateTwoTransitions,
			},
			{
				name: state3Name,
				transitions: params.stateThreeTransitions,
			},
		],
	});
}
