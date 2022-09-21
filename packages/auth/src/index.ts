import { appendToCognitoUserAgent } from 'amazon-cognito-identity-js';

import {
	CookieStorage,
	CognitoUserPool,
	AuthenticationDetails,
	ICognitoUserPoolData,
	ICognitoUserData,
	CognitoUser,
	IAuthenticationCallback,
	ICognitoUserAttributeData,
	CognitoIdToken,
	CognitoRefreshToken,
	CognitoAccessToken,
} from 'amazon-cognito-identity-js';

export function dontShakeOut() {
	console.log(appendToCognitoUserAgent);
}
