import {
	createMachine,
	MachineConfig,
	spawn,
	EventFrom,
	AssignAction,
	assign,
	sendParent,
	sendUpdate,
} from 'xstate';

import {
	CognitoIdentityClient,
	CognitoIdentity,
	GetCredentialsForIdentityCommand,
	GetIdCommand,
} from '@aws-sdk/client-cognito-identity';

export function dontShakeOut() {
	//xstate
	console.log(createMachine);
	console.log(spawn);
	console.log(assign);
	console.log(sendParent);
	console.log(sendUpdate);

	// @aws-sdk/client-cognito-identity
	console.log(CognitoIdentityClient);
	console.log(GetCredentialsForIdentityCommand);
	console.log(GetIdCommand);
}
