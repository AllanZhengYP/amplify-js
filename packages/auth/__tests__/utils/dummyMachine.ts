// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Machine } from '../../src/stateMachine/machine';
import {
	EventBroker,
	MachineEvent,
	StateTransitions,
} from '../../src/stateMachine/types';
import { DummyContext, Events, StateNames } from './dummyEventsAndTypes';

export function dummyMachine(params: {
	initialContext: DummyContext;
	stateOneTransitions?: StateTransitions<DummyContext, Events, StateNames>;
	stateTwoTransitions?: StateTransitions<DummyContext, Events, StateNames>;
	stateThreeTransitions?: StateTransitions<DummyContext, Events, StateNames>;
	machineManager?: EventBroker<MachineEvent>;
}) {
	return new Machine<DummyContext, Events, StateNames>({
		name: 'DummyMachine',
		context: params.initialContext,
		initial: 'State1',
		machineManager: params.machineManager ?? { dispatch: () => {} },
		states: {
			State1: params.stateOneTransitions ?? {},
			State2: params.stateTwoTransitions ?? {},
			State3: params.stateThreeTransitions ?? {},
		},
	});
}
