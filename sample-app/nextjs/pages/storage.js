import { Storage as AmplifyStorage } from 'aws-amplify';

const Storage = () => {
	const handleClick = async () => {
		try {
			const result = await AmplifyStorage.put('file', 'Hello World');
			console.log(result);
		} catch (e) {
			alert(e);
		}
	};
	return (
		<>
			<h1>Storage</h1>
			<button onClick={handleClick}>Upload</button>
		</>
	);
};

export default Storage;
