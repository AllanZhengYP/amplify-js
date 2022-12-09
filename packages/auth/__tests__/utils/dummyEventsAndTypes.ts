// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export type StateNames = 'State1' | 'State2' | 'State3';

export type Event1 = {
	name: 'event1';
	payload: {
		p1: 'good' | 'bad';
	};
};

export type Event2 = {
	name: 'event2';
	payload: {
		p2: 'good' | 'bad';
	};
};

export type Events = Event1 | Event2;

export type DummyContext = {
	testSource: string;
	testFn?: jest.Mock<any, any>;
	optional1?: string;
	optional2?: string;
};
