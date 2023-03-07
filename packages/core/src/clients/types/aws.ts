import { Endpoint } from './core';

export interface Credentials {
	accessKeyId: string;
	secretAccessKey: string;
	sessionToken?: string;
	expiration?: Date;
}

export type SourceData = string | ArrayBuffer | ArrayBufferView;

export type ServiceClientOptions = {
	endpointProvider: () => Promise<Endpoint>;
};
