import '../styles/globals.css';
import { noShakeOut } from '@aws-amplify/auth';

function MyApp({ Component, pageProps }) {
	noShakeOut();
	debugger;
	return <Component {...pageProps} />;
}

export default MyApp;
