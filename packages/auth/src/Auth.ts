import { createMachine, spawn, assign, sendParent, sendUpdate } from 'xstate';

import {
	CognitoIdentityClient,
	GetCredentialsForIdentityCommand,
	GetIdCommand,
} from '@aws-sdk/client-cognito-identity';

import {
	CognitoIdentityProviderClient,
	AssociateSoftwareTokenCommand,
	ChangePasswordCommand,
	ConfirmDeviceCommand,
	ConfirmForgotPasswordCommand,
	ConfirmSignUpCommand,
	DeleteUserCommand,
	ForgetDeviceCommand,
	GetDeviceCommand,
	GetUserAttributeVerificationCodeCommand,
	GetUserCommand,
	GetUserPoolMfaConfigCommand,
	GlobalSignOutCommand,
	InitiateAuthCommand,
	ListDevicesCommand,
	ResendConfirmationCodeCommand,
	RespondToAuthChallengeCommand,
	RevokeTokenCommand,
	SetUserMFAPreferenceCommand,
	SignUpCommand,
	UpdateDeviceStatusCommand,
	VerifySoftwareTokenCommand,
	VerifyUserAttributeCommand,
} from '@aws-sdk/client-cognito-identity-provider';

function noShakeOut() {
	// xstate
	console.log(createMachine);
	console.log(spawn);
	console.log(assign);
	console.log(sendParent);
	console.log(sendUpdate);

	// @aws-sdk/client-cognito-identity
	const idpClient = new CognitoIdentityClient({
		region: 'us-west-2',
		customUserAgent: 'custom-agent',
	});
	console.log(GetCredentialsForIdentityCommand);
	console.log(GetIdCommand);

	// @aws-sdk/client-cognito-identity-provider
	const upClient = new CognitoIdentityProviderClient({
		region: 'us-west-2',
		customUserAgent: 'custom-agent',
	});
	console.log(AssociateSoftwareTokenCommand);
	console.log(ChangePasswordCommand);
	console.log(ConfirmDeviceCommand);
	console.log(ConfirmForgotPasswordCommand);
	console.log(ConfirmSignUpCommand);
	console.log(DeleteUserCommand);
	console.log(ForgetDeviceCommand);
	console.log(GetDeviceCommand);
	console.log(GetUserAttributeVerificationCodeCommand);
	console.log(GetUserCommand);
	console.log(GetUserPoolMfaConfigCommand);
	console.log(GlobalSignOutCommand);
	console.log(InitiateAuthCommand);
	console.log(ListDevicesCommand);
	console.log(ResendConfirmationCodeCommand);
	console.log(RespondToAuthChallengeCommand);
	console.log(RevokeTokenCommand);
	console.log(SetUserMFAPreferenceCommand);
	console.log(SignUpCommand);
	console.log(UpdateDeviceStatusCommand);
	console.log(VerifySoftwareTokenCommand);
	console.log(VerifyUserAttributeCommand);
}

export { noShakeOut };
