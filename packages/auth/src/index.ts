import {
	CookieStorage,
	CognitoUserPool,
	AuthenticationDetails,
	ICognitoUserPoolData,
	ICognitoUserData,
	IAuthenticationCallback,
	ICognitoUserAttributeData,
	CognitoIdToken,
	CognitoRefreshToken,
	CognitoAccessToken,
	ISignUpResult,
	CognitoUser,
	MFAOption,
	CognitoUserSession,
	CognitoUserAttribute,
	NodeCallback,
	ICookieStorageData,
	ICognitoStorage,
	appendToCognitoUserAgent,
} from 'amazon-cognito-identity-js';

import { Credentials, CredentialsClass } from '@aws-amplify/core';

export function dontShakeOut() {
	// amazon-cognito-identity-js
	console.log(CookieStorage);
	console.log(CognitoUserPool);
	console.log(AuthenticationDetails);
	console.log(CognitoIdToken);
	console.log(CognitoRefreshToken);
	console.log(CognitoAccessToken);
	console.log(CognitoUser);
	console.log(CognitoUserSession);
	console.log(CognitoUserAttribute);
	console.log(appendToCognitoUserAgent);

	// @aws-amplify/core
	console.log(Credentials);
	console.log(CredentialsClass);
}
