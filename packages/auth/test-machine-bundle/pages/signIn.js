import Link from 'next/link';
import { dontShakeOut } from '@aws-amplify/auth';

function CognitoSignInPlugin() {
	async function dontShakeOut() {}

	return (
		<div>
			<h1>Test</h1>
		</div>
	);
}

export default CognitoSignInPlugin;
