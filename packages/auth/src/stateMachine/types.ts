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
 * Base type for a MachineEvent's payload
 */
export type MachineEventPayload = {};

/**
 * The type accepted by Machine's send method
 */
export type MachineEvent<PayloadType extends MachineEventPayload> = {
	name: string;
	payload: PayloadType;
	context?: Record<string, any>;
	id?: string;
};

/**
 * The type accepted by the Machine constructor
 */
export type StateMachineParams<
	ContextType extends MachineContext,
	PayloadType extends MachineEventPayload
> = {
	name: string;
	states: MachineStateParams<ContextType, MachineEventPayload>[];
	context: ContextType;
	initial: string;
	machineManagerDispatcher: Dispatcher<PayloadType>;
};

export interface MachineStateParams<
	ContextType extends MachineContext,
	PayloadType extends MachineEventPayload
> {
	name: string;
	transitions?: StateTransition<ContextType, PayloadType>[];
}

// export type InvocationEventTransition<
// 	ContextType extends MachineContext,
// 	PayloadType extends MachineEventPayload
// > = {
// 	event: string;
// 	childMachineEvent: string;
// 	actions?: TransitionAction<ContextType, PayloadType>[];
// 	guards?: TransitionGuard<ContextType, PayloadType>[];
// 	reducers?: TransitionReducer<ContextType, PayloadType>[];
// };

// export type InvocationResultTransition<
// 	ContextType extends MachineContext,
// 	ChildMachineContextType extends MachineContext
// > = {
// 	callingMachineState: string;
// 	actions?: InvocationResultTransitionAction<
// 		ContextType,
// 		ChildMachineContextType
// 	>[];
// 	guards?: InvocationResultTransitionGuard<
// 		ContextType,
// 		ChildMachineContextType
// 	>[];
// 	reducers?: InvocationResultTransitionReducer<
// 		ContextType,
// 		ChildMachineContextType
// 	>[];
// };

// /**
//  * Invoke a substate machine. The sub-statemachine can only be invoked with eventful state transit
//  */
// export type Invocation<
// 	ContextType extends MachineContext,
// 	PayloadType extends MachineEventPayload,
// 	ChildMachineContextType extends MachineContext
// > = {
// 	eventTransitions: InvocationEventTransition<ContextType, PayloadType>[];
// 	invokedMachine: Machine<ChildMachineContextType>;
// 	onSuccess: InvocationResultTransition<ContextType, ChildMachineContextType>[];
// 	onError: InvocationResultTransition<ContextType, ChildMachineContextType>[];
// };

// /**
//  * The type accepted by the MachineState constructor
//  * @typeParam PayloadType - The type of the Event's payload
//  */
// export type MachineStateParams<
// 	ContextType extends MachineContext,
// 	PayloadType extends MachineEventPayload
// > = {
// 	name: string;
// 	transitions?: StateTransition<ContextType, PayloadType>[];
// 	// immediateTransitions?: ImmediateStateTransition<ContextType>[];
// };

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
	PayloadType extends MachineEventPayload
> {
	name: string;
	send: (
		event: MachineEvent<PayloadType>
	) => MachineStateEventResponse<ContextType>;
}

/**
 * The type representing a state transition
 * @typeParam ContextType - The type of the enclosing Machine's context
 * @typeParam PayloadType - The type of the enclosing State's event payload
 * @param event - The name of the event that can trigger the Transition
 * @param nextState - The name of the State which will become the current State of the enclosing Machine, if the transition is triggered
 * @param guards An array of TransitionGuards, to be invoked before the transition is completed
 * @param reducers An array of TransitionReducers, to be invoked when the transition is completed
 * @param effects TBD
 */
export type StateTransition<
	ContextType extends MachineContext,
	PayloadType extends MachineEventPayload
> = {
	event: string;
	nextState: string;
	// actions?: TransitionAction<ContextType, PayloadType>[];
	guards?: TransitionGuard<ContextType, PayloadType>[];
	reducers?: TransitionReducer<ContextType, PayloadType>[];
	effects?: TransitionEffect<ContextType, PayloadType>[];
};

// /**
//  * Similar to immediate in Robot
//  */
// export type ImmediateStateTransition<ContextType extends MachineContext> = {
// 	nextState: string;
// 	actions?: ImmediateTransitionAction<ContextType>[];
// 	guards?: ImmediateTransitionGuard<ContextType>[];
// 	reducers?: ImmediateTransitionReducer<ContextType>[];
// };

// /**
//  * Type for a fire-and-forget action function
//  * @typeParam ContextType - The type of the enclosing Machine's context
//  * @typeParam PayloadType - The type of the Event's payload
//  */
// export type TransitionAction<
// 	ContextType extends MachineContext,
// 	PayloadType extends MachineEventPayload
// > = (context: ContextType, event: MachineEvent<PayloadType>) => Promise<void>;

export type Dispatcher<PayloadType extends MachineEventPayload> = {
	send: (event: MachineEvent<PayloadType>) => Promise<void>;
};

export type TransitionEffect<
	ContextType extends MachineContext,
	PayloadType extends MachineEventPayload
> = (
	context: ContextType,
	event: MachineEvent<PayloadType>,
	dispatcher: Dispatcher<PayloadType>
) => Promise<void>;

/**
 * Type for a TransitionGuard, which can prevent the enclosing Transition from completing
 * @typeParam ContextType - The type of the enclosing Machine's context
 * @typeParam PayloadType - The type of the Event's payload
 */
export type TransitionGuard<
	ContextType extends MachineContext,
	PayloadType extends MachineEventPayload
> = (context: ContextType, event: MachineEvent<PayloadType>) => boolean;

/**
 * Type for a TransitionReducer, which is used to modify the enclosing Machine's Context
 * @typeParam ContextType - The type of the enclosing Machine's context
 * @typeParam PayloadType - The type of the Event's payload
 */
export type TransitionReducer<
	ContextType extends MachineContext,
	PayloadType extends MachineEventPayload
> = (context: ContextType, event: MachineEvent<PayloadType>) => ContextType;

// export type InvocationPromise<
// 	ContextType extends MachineContext,
// 	PayloadType extends MachineEventPayload
// > = (context: ContextType, event: MachineEvent<PayloadType>) => Promise<void>;

// export type ImmediateTransitionAction<ContextType extends MachineContext> = (
// 	context: ContextType
// ) => Promise<void>;

// export type ImmediateTransitionGuard<ContextType extends MachineContext> = (
// 	context: ContextType
// ) => boolean;

// export type ImmediateTransitionReducer<ContextType extends MachineContext> = (
// 	context: ContextType
// ) => ContextType;

// export type InvocationResultTransitionAction<
// 	ContextType extends MachineContext,
// 	ChildContextType extends MachineContext
// > = (context: ContextType, childContext: ChildContextType) => Promise<void>;

// export type InvocationResultTransitionGuard<
// 	ContextType extends MachineContext,
// 	ChildContextType extends MachineContext
// > = (context: ContextType, childContext: ChildContextType) => boolean;

// export type InvocationResultTransitionReducer<
// 	ContextType extends MachineContext,
// 	ChildContextType extends MachineContext
// > = (context: ContextType, childContext: ChildContextType) => ContextType;
