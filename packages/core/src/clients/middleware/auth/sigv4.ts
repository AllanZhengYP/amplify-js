// import { Sha256 } from "@aws-crypto/sha256-browser/build/webCryptoSha256"; // Use this for v6
import { Sha256 } from '@aws-crypto/sha256-js'; // Use this for v5
import { toHex } from '@aws-sdk/util-hex-encoding';
import { Middleware, SideEffectReference } from '../../types/core';
import { HttpRequest, HttpResponse } from '../../types/http';
import { Credentials, SourceData } from '../../types/aws';

/**
 * TODO
 */
export interface SigV4AuthOptions {
	signingRegion: string;
	signingService: string;
	credentialsProvider: () => Promise<Credentials>;
	signingDate?: Date;
	uriEscapePath?: boolean;
	unsignableHeaders?: string[];
	clockOffset: SideEffectReference<number>;
}

export const sigV4Auth: Middleware<
	HttpRequest,
	HttpResponse,
	SigV4AuthOptions
> = (next, context) =>
	async function sigV4Auth(request, options) {
		/**
		 * TODO: implement SigV4 signing.
		 */
		const signedRequest = await signRequest(request, options);
		return next(signedRequest, options);
	};

/**
 * TODO: move it to src/Signer.ts
 */
export const signRequest = async (
	request: HttpRequest,
	options: SigV4AuthOptions
): Promise<HttpRequest> => {
	const { destination, method, headers } = request;
	const date = (options.signingDate ?? new Date())
		.toISOString()
		.replace(/[:\-]|\.\d{3}/g, '');
	const day = date.substring(0, 8);
	const credential = await options.credentialsProvider();

	const copiedUrl = new URL(destination.toString());
	const copiedHeaders = new Headers(headers);
	copiedHeaders.set('host', copiedUrl.host);
	copiedHeaders.set('x-amz-date', date);
	if (credential.sessionToken) {
		copiedHeaders.set('x-amz-security-token', credential.sessionToken);
	}

	// 1: create canonical request
	const requestStr = await canonicalRequest(request);
	// 2: create string to sign
	const credScope = credentialScope(
		day,
		options.signingRegion,
		options.signingService
	);
	const strToSign = stringToSign(date, credScope, await hash(requestStr));
	// 3: create signature
	const key = await signingKey(
		credential.secretAccessKey,
		day,
		options.signingRegion,
		options.signingService
	);
	const signature = await getSignature(key, strToSign);
	const authHeader = authorizationHeader(
		credential.accessKeyId,
		credScope,
		signedHeaders(copiedHeaders),
		signature
	);
	copiedHeaders.set('Authorization', authHeader);

	return {
		...request,
		headers: copiedHeaders,
		destination: copiedUrl,
	};
};

const canonicalRequest = async (request: HttpRequest): Promise<string> => {
	return [
		request.method || '/',
		encodeURIComponent(request.destination.pathname).replace(/%2F/gi, '/'),
		canonicalQueryString(request.destination.searchParams.toString()),
		canonicalHeaders(request.headers),
		signedHeaders(request.headers),
		await hash(request.body as SourceData), // TODO: handle other body types
	].join('\n');
};

const canonicalQueryString = (query: string): string => {
	if (!query || query.length === 0) {
		return '';
	}
	return query
		.split('&')
		.map(e => {
			const key_val = e.split('=');
			if (key_val.length === 1) {
				return e;
			} else {
				const reencodedValue = escapeRfc3986(key_val[1]);
				return key_val[0] + '=' + reencodedValue;
			}
		})
		.sort((a, b) => {
			const key_a = a.split('=')[0];
			const key_b = b.split('=')[0];
			if (key_a === key_b) {
				return a < b ? -1 : 1;
			} else {
				return key_a < key_b ? -1 : 1;
			}
		})
		.join('&');
};

const escapeRfc3986 = (component: string): string => {
	return component.replace(/[!'()*]/g, function (c) {
		return '%' + c.charCodeAt(0).toString(16).toUpperCase();
	});
};

const canonicalHeaders = (headers: Headers): string => {
	const headerEntries = Array.from(headers.entries());
	if (headerEntries.length === 0) {
		return '';
	}
	return (
		headerEntries
			.map(([key, value]) => [
				key.toLowerCase(),
				value ? value.trim().replace(/\s+/g, ' ') : '',
			])
			.sort((a, b) => (a[0] < b[0] ? -1 : 1))
			.map(([key, value]) => key + ':' + value)
			.join('\n') + '\n'
	);
};

// TODO: filter out signable headers
const signedHeaders = (headers: Headers): string => {
	return Array.from(headers.keys())
		.map(key => key.toLowerCase())
		.sort()
		.join(';');
};

const hash = async (body: SourceData): Promise<string> => {
	const hash = new Sha256();
	// TODO: cast type to make tsc happy.
	hash.update((body as string) ?? '');
	return toHex(await hash.digest());
};

const credentialScope = (
	day: string,
	region: string,
	service: string
): string => {
	return `${day}/${region}/${service}/aws4_request`;
};

const stringToSign = (
	date: string,
	credentialScope: string,
	hashedRequest: string
): string => {
	return ['AWS4-HMAC-SHA256', date, credentialScope, hashedRequest].join('\n');
};

const encrypt = async (
	key: SourceData,
	msg: SourceData
): Promise<Uint8Array> => {
	const hash = new Sha256(key);
	hash.update(msg);
	return await hash.digest();
};

const signingKey = async (
	secretKey: string,
	day: string,
	region: string,
	service: string
): Promise<Uint8Array> => {
	const k = `AWS4${secretKey}`;
	const kDay = await encrypt(k, day);
	const kRegion = await encrypt(kDay, region);
	const kService = await encrypt(kRegion, service);
	return await encrypt(kService, 'aws4_request');
};

const getSignature = async (
	signingKey: Uint8Array,
	stringToSign: string
): Promise<string> => {
	return toHex(await encrypt(signingKey, stringToSign));
};

const authorizationHeader = (
	accessKeyId: string,
	scope: string,
	signedHeaders: string,
	signature: string
): string => {
	return [
		`AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}`,
		`SignedHeaders=${signedHeaders}`,
		`Signature=${signature}`,
	].join(', ');
};
