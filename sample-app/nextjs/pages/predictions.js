import { Amplify, Predictions as AmplifyPredictions } from 'aws-amplify';

const Predictions = () => {
	const handleClick = async () => {
		try {
			const result = await AmplifyPredictions.convert({
				textToSpeech: {
					source: {
						text: 'Hellow World!',
					},
				},
			});
			console.log(result);
		} catch (e) {
			alert(e);
		}
	};
	return (
		<>
			<h1>Text-to-speach</h1>
			<button onClick={handleClick}>Convert</button>
		</>
	);
};

export default Predictions;
