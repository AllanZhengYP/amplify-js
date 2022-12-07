// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// import { Completer } from './completer';
// import { Invocation } from './invocation';
// import { Machine } from './machine';

/**
 * Base type for a Machine's context
 */
export type MachineContext = {};

/**
 * The type accepted by Machine's send method
 */
export type MachineEvent = {
	name: string;
	payload: unknown;
	id?: string;
};

export type EventBroker<EventType extends MachineEvent> = {
	dispatch: (event: EventType) => void;
};

export type EventConsumer<EventType extends MachineEvent> = {
	accept: (event: EventType) => Promise<void>;
};

/**
 * The type accepted by the Machine constructor
 */
export type StateMachineParams<
	ContextType extends MachineContext,
	EventType extends MachineEvent
> = {
	name: string;
	states: MachineStateParams<ContextType, EventType>[];
	context: ContextType;
	initial: string;
	machineManagerBroker: EventBroker<EventType>;
};

export interface MachineStateParams<
	ContextType extends MachineContext,
	EventType extends MachineEvent
> {
	name: string;
	transitions?: StateTransition<ContextType, EventType>[];
}

/**
 * The response from sending an event to a machine state.
 * @typeParam ContextType - The type of the enclosing Machine's context
 * @param nextState - The name of next state. It can be the same of current state,
 * indicating no state transit happens.
 * @param effectsPromise - The promise resolves when all the assciated state
 * transit effects are resolved. {@link StateTransition.effects}
 * @param newContext - The updated machine context after running the associated
 * state transit reducers. {@link StateTransition.reducers}
 */
export interface MachineStateEventResponse<ContextType extends MachineContext> {
	nextState: string;
	newContext?: ContextType;
	effectsPromise?: Promise<unknown>;
}

export interface MachineState<
	ContextType extends MachineContext,
	EventType extends MachineEvent
> {
	name: string;
	accept: (event: EventType) => MachineStateEventResponse<ContextType>;
}

/**
 * The type representing a state transition
 * @typeParam ContextType - The type of the enclosing Machine's context
 * @typeParam MachineEvent - The type of the enclosing State's events
 * @param event - The name of the event that can trigger the Transition
 * @param nextState - The name of the State which will become the current State of the enclosing Machine, if the transition is triggered
 * @param guards An array of TransitionGuards, to be invoked before the transition is completed
 * @param reducers An array of TransitionReducers, to be invoked when the transition is completed
 * @param effects TBD
 */
export type StateTransition<
	ContextType extends MachineContext,
	EventType extends MachineEvent
> = {
	event: EventType['name'];
	nextState: string;
	// TODO: investigate whether we can narrow tye guards, reducers, effects'
	// event type
	guards?: TransitionGuard<ContextType, EventType>[];
	reducers?: TransitionReducer<ContextType, EventType>[];
	effects?: TransitionEffect<ContextType, EventType>[];
};

export type TransitionEffect<
	ContextType extends MachineContext,
	EventType extends MachineEvent
> = (
	context: ContextType,
	event: EventType,
	eventBroker: EventBroker<EventType>
) => Promise<void>;

/**
 * Type for a TransitionGuard, which can prevent the enclosing Transition from completing
 * @typeParam ContextType - The type of the enclosing Machine's context
 * @typeParam EventType - The type of the event
 */
export type TransitionGuard<
	ContextType extends MachineContext,
	EventType extends MachineEvent
> = (context: ContextType, event: EventType) => boolean;

/**
 * Type for a TransitionReducer, which is used to modify the enclosing Machine's Context
 * @typeParam ContextType - The type of the enclosing Machine's context
 * @typeParam EventType - The type of the event
 */
export type TransitionReducer<
	ContextType extends MachineContext,
	EventType extends MachineEvent
> = (context: ContextType, event: EventType) => ContextType;
