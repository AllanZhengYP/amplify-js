import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import Amplify from '@aws-amplify/core';

Amplify.configure({});

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
