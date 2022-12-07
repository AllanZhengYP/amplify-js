// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Machine } from '../../src/stateMachine/machine';
import { MachineContext } from '../../src/stateMachine/types';

export const state1Name = 'State1';
export const state2Name = 'State2';
export const state3Name = 'State3';

export const goodEvent1 = {
	name: 'event1' as const,
	payload: {
		p1: 'good',
	},
};

export const badEvent1 = {
	name: 'event1' as const,
	payload: {
		p1: 'bad',
	},
};

export const goodEvent2 = {
	name: 'event2' as const,
	payload: {
		p2: 'good',
	},
};

export const badEvent2 = {
	name: 'event2' as const,
	payload: {
		p2: 'bad',
	},
};

export type Events =
	| typeof goodEvent1
	| typeof badEvent1
	| typeof goodEvent2
	| typeof badEvent2;

export type DummyContext = MachineContext & {
	testSource: string;
	testFn?: jest.Mock<any, any>;
	optional1?: string;
	optional2?: string;
	actor?: Machine<DummyContext, Events>;
};

export type State1Payload = {
	p1?: string;
};

export type State2Payload = {
	p2?: string;
};

export type State3Payload = {
	p3?: string;
};
