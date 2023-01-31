import {
	serializeAws_restJson1PutEventsCommand,
	deserializeAws_restJson1PutEventsCommand,
} from '@aws-sdk/client-pinpoint/dist-es/protocols/Aws_restJson1';

import { baseClient } from './client';

export const pinpointClient = baseClient(
	'pinpoint',
	'mobiletargeting',
	region => ({
		protocol: 'https:',
		hostname: `pinpoint.${region}.amazonaws.com`,
		path: '/',
	})
);

export const putEvents = [
	serializeAws_restJson1PutEventsCommand,
	deserializeAws_restJson1PutEventsCommand,
];
