// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// import { Completer } from './completer';
// import { Invocation } from './invocation';
import { Machine } from './machine';
import { MachineState } from './machineState';

/**
 * Base type for a Machine's context
 */
export type MachineContext = object;

/**
 * Base type for a MachineEvent's payload
 */
export type MachineEventPayload = object;

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
export type StateMachineParams<ContextType extends MachineContext> = object & {
	name: string;
	states: MachineState<ContextType, MachineEventPayload>[];
	context: ContextType;
	initial: string;
};

export type InvocationEventTransition<
	ContextType extends MachineContext,
	PayloadType extends MachineEventPayload
> = {
	event: string;
	childMachineEvent: string;
	actions?: TransitionAction<ContextType, PayloadType>[];
	guards?: TransitionGuard<ContextType, PayloadType>[];
	reducers?: TransitionReducer<ContextType, PayloadType>[];
};

export type InvocationResultTransition<
	ContextType extends MachineContext,
	ChildMachineContextType extends MachineContext
> = {
	callMachineState: string;
	actions?: InvocationResultTransitionAction<
		ContextType,
		ChildMachineContextType
	>[];
	guards?: InvocationResultTransitionGuard<
		ContextType,
		ChildMachineContextType
	>[];
	reducers?: InvocationResultTransitionReducer<
		ContextType,
		ChildMachineContextType
	>[];
};

/**
 * Invoke a substate machine. The sub-statemachine can only be invoked with eventful state transit
 */
export type Invocation<
	ContextType extends MachineContext,
	PayloadType extends MachineEventPayload,
	ChildMachineContextType extends MachineContext
> = {
	eventTransitions: InvocationEventTransition<ContextType, PayloadType>[];
	invokedMachine: Machine<ChildMachineContextType>;
	onSuccess: InvocationResultTransition<ContextType, ChildMachineContextType>[];
	onError: InvocationResultTransition<ContextType, ChildMachineContextType>[];
};

/**
 * The type accepted by the MachineState constructor
 * @typeParam PayloadType - The type of the Event's payload
 */
export type MachineStateParams<
	ContextType extends MachineContext,
	PayloadType extends MachineEventPayload
> = {
	name: string;
	transitions?: StateTransition<ContextType, PayloadType>[];
	immediateTransitions?: ImmediateStateTransition<ContextType>[];
};

/**
 * The type representing a state transition
 * @typeParam ContextType - The type of the enclosing Machine's context
 * @typeParam PayloadType - The type of the enclosing State's event payload
 * @param event - The name of the event that can trigger the Transition
 * @param nextState - The name of the State which will become the current State of the enclosing Machine, if the transition is triggered
 * @param actions - An array of TransitionActions, to be invoked when transition is completed
 * @param guards An array of TransitionGuards, to be invoked before the transition is completed
 * @param reducers An array of TransitionReducers, to be invoked when the transition is completed
 */
export type StateTransition<
	ContextType extends MachineContext,
	PayloadType extends MachineEventPayload
> = {
	event: string;
	nextState: string;
	actions?: TransitionAction<ContextType, PayloadType>[];
	guards?: TransitionGuard<ContextType, PayloadType>[];
	reducers?: TransitionReducer<ContextType, PayloadType>[];
};

/**
 * Similar to immediate in Robot
 */
export type ImmediateStateTransition<ContextType extends MachineContext> = {
	nextState: string;
	actions?: ImmediateTransitionAction<ContextType>[];
	guards?: ImmediateTransitionGuard<ContextType>[];
	reducers?: ImmediateTransitionReducer<ContextType>[];
};

/**
 * Type for a fire-and-forget action function
 * @typeParam ContextType - The type of the enclosing Machine's context
 * @typeParam PayloadType - The type of the Event's payload
 */
export type TransitionAction<
	ContextType extends MachineContext,
	PayloadType extends MachineEventPayload
> = (context: ContextType, event: MachineEvent<PayloadType>) => Promise<void>;

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

export type InvocationPromise<
	ContextType extends MachineContext,
	PayloadType extends MachineEventPayload
> = (context: ContextType, event: MachineEvent<PayloadType>) => Promise<void>;

export type ImmediateTransitionAction<ContextType extends MachineContext> = (
	context: ContextType
) => Promise<void>;

export type ImmediateTransitionGuard<ContextType extends MachineContext> = (
	context: ContextType
) => boolean;

export type ImmediateTransitionReducer<ContextType extends MachineContext> = (
	context: ContextType
) => ContextType;

export type InvocationResultTransitionAction<
	ContextType extends MachineContext,
	ChildContextType extends MachineContext
> = (context: ContextType, childContext: ChildContextType) => Promise<void>;

export type InvocationResultTransitionGuard<
	ContextType extends MachineContext,
	ChildContextType extends MachineContext
> = (context: ContextType, childContext: ChildContextType) => boolean;

export type InvocationResultTransitionReducer<
	ContextType extends MachineContext,
	ChildContextType extends MachineContext
> = (context: ContextType, childContext: ChildContextType) => ContextType;
