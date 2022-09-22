import { noShakeOut } from '@aws-amplify/auth';

const Home = () => {
	noShakeOut();
	return <h1>AWS AMPLIFY</h1>;
};

export default Home;
