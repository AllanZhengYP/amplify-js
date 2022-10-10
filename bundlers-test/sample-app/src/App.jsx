import React from 'react'; // Missing this will fail esBuild
import { Amplify } from 'aws-amplify';

Amplify.configure({});

function App() {
	return (
		<div className="App">
			<h1>Bundler Test</h1>
		</div>
	);
}

export default App;
