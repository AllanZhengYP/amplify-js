import { Amplify } from 'aws-amplify';

Amplify.configure({});

function MyApp({ Component, pageProps }) {
	return <Component {...pageProps} />;
}

export default MyApp;
