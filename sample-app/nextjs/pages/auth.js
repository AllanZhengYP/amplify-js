import { Auth as AmplifyAuth } from 'aws-amplify';

const Auth = () => {
	const handleClick = async () => {
		try {
			const result = await AmplifyAuth.signIn({
				username: 'username',
				password: 'password',
			});
			console.log(result);
		} catch (e) {
			alert(e);
		}
	};
	return (
		<>
			<h1>Auth</h1>
			<button onClick={handleClick}>Sign In</button>
		</>
	);
};

export default Auth;
