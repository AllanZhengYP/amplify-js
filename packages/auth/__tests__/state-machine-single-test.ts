// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { HubCapsule } from '@aws-amplify/core';
import { noop } from 'lodash';
import { Machine } from '../src/stateMachine/machine';
import { StateTransition } from '../src/stateMachine/types';
import {
	badEvent1,
	DummyContext,
	Events,
	goodEvent1,
	goodEvent2,
	state1Name,
	state2Name,
} from './utils/dummyEventsAndTypes';
import { dummyMachine } from './utils/dummyMachine';

let machine: Machine<DummyContext, Events>;
let stateTwoTransitions: StateTransition<DummyContext, Events>[];

const testSource = 'state-machine-single-tests';
let events: HubCapsule[] = [];
const timeoutMS = 200;

describe('State machine instantiation tests...', () => {
	beforeEach(() => {
		events = [];
		machine = dummyMachine({
			initialContext: { testSource },
			stateOneTransitions: [
				{
					event: 'event1',
					nextState: state2Name,
				},
			],
		});
		machine.hub.listen(machine!.hubChannel, data => {
			events.push(data);
		});
	});

	test('...the SM can be instantiated', () => {
		expect(machine).toBeTruthy();
	});

	test("...the SM's initial context is set", async () => {
		const currentStateAndContext = machine.getCurrentState();
		expect(currentStateAndContext.context.testSource).toEqual(testSource);
	});

	test("...the SM's initial state is set", async () => {
		const currentStateAndContext = machine?.getCurrentState();
		expect(currentStateAndContext?.currentState).toEqual(state1Name);
	});

	test('...the SM performs a simple state transition', async () => {
		await machine?.accept(goodEvent1);
		expect(machine?.getCurrentState()?.currentState).toEqual(state2Name);
	});
});

describe('State machine guard tests...', () => {
	beforeEach(() => {
		events = [];
		machine = dummyMachine({
			initialContext: { testSource },
			stateOneTransitions: [
				{
					event: goodEvent1.name,
					nextState: state2Name,
					guards: [
						(_ctx, evt) => {
							return (
								(evt as typeof goodEvent1 | typeof badEvent1).payload?.p1 ==
								'bad'
							);
						},
					],
				},
			],
		});
		machine.hub.listen(machine!.hubChannel, data => {
			events.push(data);
		});
	});

	test('...the state transitions if guard passes', async () => {
		await machine?.accept(goodEvent1);
		expect(machine?.getCurrentState().currentState).toEqual(state2Name);
	});

	test('...the state transitions does not transition if guard fails', async () => {
		await machine?.accept(badEvent1);
		expect(machine?.getCurrentState().currentState).toEqual(state1Name);
	});
});

describe('State machine action tests...', () => {
	const mockDispatch = jest.fn();

	beforeEach(() => {
		const jestMock = jest.fn();
		events = [];
		machine = dummyMachine({
			initialContext: { testSource, testFn: jestMock },
			stateOneTransitions: [
				{
					event: 'event1',
					nextState: state2Name,
					guards: [
						(_, evt) => {
							return (
								(evt as typeof goodEvent1 | typeof badEvent1).payload?.p1 ==
								'bad'
							);
						},
					],
					effects: [
						async (ctx, _, broker) => {
							ctx.testFn ? ctx.testFn() : noop;
							broker.dispatch(goodEvent2);
						},
					],
				},
			],
			machineManagerBroker: { dispatch: mockDispatch },
		});
		machine.hub.listen(machine!.hubChannel, data => {
			events.push(data);
		});
	});

	test('...the actions do not fire before transition', async () => {
		const currentStateAndContext = machine?.getCurrentState();
		expect(currentStateAndContext.context.testFn).toHaveBeenCalledTimes(0);
	});

	test('...the actions fire after transition', async () => {
		await machine?.accept(goodEvent1);
		const currentStateAndContext = machine?.getCurrentState();
		expect(currentStateAndContext.context.testFn).toHaveBeenCalledTimes(1);
		expect(mockDispatch).toBeCalledTimes(1);
		expect(mockDispatch).toBeCalledWith(goodEvent2);
	});

	test('...the actions do not fire if guard fails', async () => {
		await machine?.accept(badEvent1);
		const currentStateAndContext = machine?.getCurrentState();
		expect(currentStateAndContext.context.testFn).toHaveBeenCalledTimes(0);
	});
});

describe('State machine reducer tests...', () => {
	beforeEach(() => {
		const jestMock = jest.fn(() => {});
		events = [];
		machine = dummyMachine({
			initialContext: { testSource, testFn: jestMock },
			stateOneTransitions: [
				{
					event: 'event1',
					nextState: state2Name,
					guards: [
						(_, evt) => {
							return (
								(evt as typeof goodEvent1 | typeof badEvent1).payload?.p1 ==
								'bad'
							);
						},
					],
					reducers: [
						(ctx, evt) => {
							ctx.optional1 = (
								evt as typeof goodEvent1 | typeof badEvent1
							).payload?.p1;
							return ctx;
						},
					],
				},
			],
		});
		machine.hub.listen(machine!.hubChannel, data => {
			events.push(data);
		});
	});

	test('...the reducer is not invoked before transition ', async () => {
		const currentStateAndContext = machine?.getCurrentState();
		expect(currentStateAndContext.context.optional1).toBeFalsy();
	});

	test('...the reducers fire after transition', async () => {
		await machine?.accept(goodEvent1);
		const currentStateAndContext = machine?.getCurrentState();
		expect(currentStateAndContext.context.optional1).toEqual('good');
	});

	test('...the reducers do not fire if guard fails', async () => {
		await machine?.accept(badEvent1);
		const currentStateAndContext = await machine?.getCurrentState();
		expect(currentStateAndContext.context.optional1).toBeFalsy();
	});
});

// describe('State Machine queueing tests...', () => {
// 	beforeEach(() => {
// 		events = [];
// 		stateTwoInvocation = new Invocation<DummyContext, State1Payload>({
// 			invokedPromise: async () => {
// 				await new Promise(r => setTimeout(r, timeoutMS));
// 				console.log('done...');
// 			},
// 		});
// 		stateOneTransitions = [
// 			{
// 				event: 'event1',
// 				nextState: state2Name,
// 			},
// 		];
// 		stateTwoTransitions = [
// 			{
// 				event: 'event2',
// 				nextState: state3Name,
// 			},
// 		];
// 		machine = dummyMachine({
// 			initialContext: { testSource },
// 			stateOneTransitions,
// 			stateTwoTransitions,
// 			stateTwoInvocation,
// 		});
// 		machine.hub.listen(machine!.hubChannel, data => {
// 			events.push(data);
// 		});
// 	});

// 	test('...the machine waits for first event to process, including when there are async tasks running', async () => {
// 		machine?.send<State1Payload>(goodEvent1);
// 		machine?.send<State2Payload>(goodEvent2);

// 		// invocation will block for value of timeoutMS
// 		// thus we check that transition has not happened yet.
// 		const currentStateAndContext1 = await machine?.getCurrentState();
// 		expect(currentStateAndContext1.currentState.name).toEqual(state2Name);

// 		// wait again to make sure the timeout has elapsed before checking state again
// 		await new Promise(r => setTimeout(r, timeoutMS + 1));
// 		const currentStateAndContext2 = await machine?.getCurrentState();
// 		expect(currentStateAndContext2.currentState.name).toEqual(state3Name);
// 	});
// });
