import { HttpRequest } from '@aws-amplify/core/internals/aws-client-utils';
import { listObjectsV2, getObject } from '../../../src/AwsClients/S3';

type MockFetchResponse = {
	body: BodyInit;
	headers: HeadersInit;
	status: number;
};

// TODO: remove this after upgrading ts-jest
type Awaited<T> = T extends PromiseLike<infer U> ? U : never;

type ApiFunctionalTestHappyCase<ApiHandler extends (...args: any) => any> = [
	'happy case',
	string, // name
	ApiHandler, // handler
	Parameters<ApiHandler>[0], // config
	Parameters<ApiHandler>[1], // input
	HttpRequest, // expected request
	MockFetchResponse, // response
	Awaited<ReturnType<ApiHandler>> // expected output
];

type ApiFunctionalTestErrorCase<ApiHandler extends (...args: any) => any> = [
	'error case',
	string, // name
	ApiHandler, // handler
	Parameters<ApiHandler>[0], // config
	Parameters<ApiHandler>[1], // input
	HttpRequest, // expected request
	MockFetchResponse, // response
	{} // error
];

type ApiFunctionalTestCase<ApiHandler extends (...args: any) => any> =
	| ApiFunctionalTestHappyCase<ApiHandler>
	| ApiFunctionalTestErrorCase<ApiHandler>;

const EMPTY_SHA256 =
	'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

const MOCK_REQUEST_ID = 'requestId';
const MOCK_EXTENDED_REQUEST_ID = 'requestId2';
const DEFAULT_RESPONSE_HEADERS = {
	'x-amz-id-2': MOCK_EXTENDED_REQUEST_ID,
	'x-amz-request-id': MOCK_REQUEST_ID,
};

const defaultConfig = {
	region: 'us-east-1',
	credentials: {
		accessKeyId: 'key',
		secretAccessKey: 'secret',
	},
};

const defaultRequiredRequestHeaders = {
	authorization: expect.stringContaining('Signature'),
	host: 'bucket.s3.us-east-1.amazonaws.com',
	'x-amz-content-sha256': EMPTY_SHA256,
	'x-amz-date': expect.stringMatching(/^\d{8}T\d{6}Z/),
	'x-amz-user-agent': expect.stringContaining('aws-amplify'),
};

// API Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectsV2.html
const listObjectsV2HappyCase: ApiFunctionalTestCase<typeof listObjectsV2> = [
	'happy case',
	'listObjectsV2',
	listObjectsV2,
	defaultConfig,
	{
		Bucket: 'bucket',
		ContinuationToken: 'ContinuationToken',
		Delimiter: 'Delimiter',
		EncodingType: 'EncodingType',
		ExpectedBucketOwner: 'ExpectedBucketOwner',
		FetchOwner: false,
		MaxKeys: 0,
		Prefix: 'Prefix',
		RequestPayer: 'RequestPayer',
		StartAfter: 'StartAfter',
	},
	expect.objectContaining({
		url: expect.objectContaining({
			href: 'https://bucket.s3.us-east-1.amazonaws.com/?list-type=2&continuation-token=ContinuationToken&delimiter=Delimiter&encoding-type=EncodingType&fetch-owner=false&max-keys=0&prefix=Prefix&start-after=StartAfter',
		}),
		method: 'GET',
		headers: expect.objectContaining({
			...defaultRequiredRequestHeaders,
			'x-amz-request-payer': 'RequestPayer',
			'x-amz-expected-bucket-owner': 'ExpectedBucketOwner',
		}),
	}),
	{
		status: 200,
		headers: DEFAULT_RESPONSE_HEADERS,
		body: `<?xml version="1.0" encoding="UTF-8"?>
		<ListBucketResult>
		<Name>bucket</Name>
		<Prefix/>
		<KeyCount>205</KeyCount>
		<StartAfter>ExampleGuide.pdf</StartAfter>
		<MaxKeys>1000</MaxKeys>
		<IsTruncated>false</IsTruncated>
		<EncodingType>string</EncodingType>
		<ContinuationToken>1ueGcxLPRx1Tr/XYExHnhbYLgveDs2J/wm36Hy4vbOwM=</ContinuationToken>
		<NextContinuationToken>Next1ueGcxLPRx1Tr/XYExHnhbYLgveDs2J/wm36Hy4vbOwM=</NextContinuationToken>
		<Contents>
		 <Key>ExampleObject.txt</Key>
		 <LastModified>2013-09-17T18:07:53.000Z</LastModified>
		 <ETag>"599bab3ed2c697f1d26842727561fd94"</ETag>
		 <Size>857</Size>
		 <StorageClass>REDUCED_REDUNDANCY</StorageClass>
	 </Contents>
		<Contents>
		 <Key>my-image.jpg</Key>
		 <LastModified>2009-10-12T17:50:30.000Z</LastModified>
		 <ETag>"fba9dede5f27731c9771645a39863328"</ETag>
		 <Size>434234</Size>
		 <StorageClass>STANDARD</StorageClass>
		 <Owner>
			 <ID>8a6925ce4a7f21c32aa379004fef</ID>
			 <DisplayName>string</DisplayName>
		 </Owner>
		</Contents>
		<Delimiter>string</Delimiter>
		<CommonPrefixes>
			<Prefix>photos/2006/February/</Prefix>
		</CommonPrefixes>
		<CommonPrefixes>
			<Prefix>photos/2006/January/</Prefix>
		</CommonPrefixes>
 </ListBucketResult>`,
	},
	{
		CommonPrefixes: [
			{
				Prefix: 'photos/2006/February/',
			},
			{
				Prefix: 'photos/2006/January/',
			},
		],
		Contents: [
			{
				ETag: '"599bab3ed2c697f1d26842727561fd94"',
				Key: 'ExampleObject.txt',
				LastModified: new Date('2013-09-17T18:07:53.000Z'),
				Size: 857,
				StorageClass: 'REDUCED_REDUNDANCY',
			},
			{
				ETag: '"fba9dede5f27731c9771645a39863328"',
				Key: 'my-image.jpg',
				LastModified: new Date('2009-10-12T17:50:30.000Z'),
				Size: 434234,
				StorageClass: 'STANDARD',
				Owner: {
					ID: '8a6925ce4a7f21c32aa379004fef',
					DisplayName: 'string',
				},
			},
		],
		ContinuationToken: '1ueGcxLPRx1Tr/XYExHnhbYLgveDs2J/wm36Hy4vbOwM=',
		Delimiter: 'string',
		EncodingType: 'string',
		IsTruncated: false,
		KeyCount: 205,
		MaxKeys: 1000,
		Name: 'bucket',
		NextContinuationToken: 'Next1ueGcxLPRx1Tr/XYExHnhbYLgveDs2J/wm36Hy4vbOwM=',
		Prefix: '',
		StartAfter: 'ExampleGuide.pdf',
		$metadata: expect.objectContaining({
			attempts: 1,
			requestId: MOCK_REQUEST_ID,
			extendedRequestId: MOCK_EXTENDED_REQUEST_ID,
			httpStatusCode: 200,
		}),
	},
];

const listObjectsV2ErrorCase: ApiFunctionalTestCase<typeof listObjectsV2> = [
	'error case',
	'listObjectsV2',
	listObjectsV2,
	defaultConfig,
	listObjectsV2HappyCase[4],
	listObjectsV2HappyCase[5],
	{
		status: 403,
		headers: DEFAULT_RESPONSE_HEADERS,
		body: `<?xml version="1.0" encoding="UTF-8"?>
		<Error>
			<Code>NoSuchKey</Code>
			<Message>The resource you requested does not exist</Message>
			<Resource>/mybucket/myfoto.jpg</Resource> 
			<RequestId>4442587FB7D0A2F9</RequestId>
		</Error>`,
	},
	{
		$metadata: expect.objectContaining({
			attempts: 1,
			requestId: MOCK_REQUEST_ID,
			extendedRequestId: MOCK_EXTENDED_REQUEST_ID,
			httpStatusCode: 200,
		}),
		message: 'The resource you requested does not exist',
		name: 'NoSuchKey',
	},
];

const getObjectResponseHeaders = {
	'x-amz-delete-marker': 'true',
	'accept-ranges': 'types',
	'x-amz-expiration':
		'expiry-date="Fri, 23 Dec 2012 00:00:00 GMT", rule-id="picture-deletion-rule"',
	'x-amz-restore':
		'ongoing-request="false", expiry-date="Fri, 21 Dec 2012 00:00:00 GMT"', // Ref: https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadObject.html#AmazonS3-HeadObject-response-header-Restore
	'last-modified': 'Sun, 1 Jan 2006 12:00:00 GMT',
	'content-length': '434234',
	etag: 'fba9dede5f27731c9771645a39863328',
	'x-amz-checksum-crc32': '696e1637',
	'x-amz-checksum-crc32c': '028A5A90',
	'x-amz-checksum-sha1': '5f3446f6cb2f4962082dfe2d298d1b1a32a21b21',
	'x-amz-checksum-sha256':
		'1643577c036c1e057505b4dce59f3d34bd3fe6224f1064c80dd5426b27a12360',
	'x-amz-missing-meta': '2',
	'x-amz-version-id': '3HL4kqtJlcpXroDTDmjVBH40Nrjfkd',
	'cache-control': 'no-store',
	'content-disposition': 'attachment',
	'content-encoding': 'zip',
	'content-language': 'en-US',
	'content-range': 'bytes 0-9/443',
	'content-type': 'text/plain',
	expires: 'Thu, 01 Dec 1994 16:00:00 GMT',
	'x-amz-website-redirect-location': 'http://www.example.com/',
	'x-amz-server-side-encryption': 'aws:kms',
	'x-amz-server-side-encryption-customer-algorithm': 'AES256',
	'x-amz-server-side-encryption-customer-key-md5': 'ZjQrne1X/iTcskbY2m3example',
	'x-amz-server-side-encryption-aws-kms-key-id': '12345keyId',
	'x-amz-server-side-encryption-bucket-key-enabled': 'true',
	'x-amz-storage-class': 'STANDARD',
	'x-amz-request-charged': 'requester',
	'x-amz-replication-status': 'COMPLETE',
	'x-amz-mp-parts-count': '100',
	'x-amz-tagging-count': '100',
	'x-amz-object-lock-mode': 'COMPLIANCE',
	'x-amz-object-lock-retain-until-date': 'Fri, 23 Dec 2012 00:00:00 GMT',
	'x-amz-object-lock-legal-hold': 'ON',
	// metadata
	'x-amz-meta-param1': 'value 1',
	'x-amz-meta-param2': 'value 2',
} as const;

const getObjectHappyCase: ApiFunctionalTestCase<typeof getObject> = [
	'happy case',
	'getObject',
	getObject,
	defaultConfig,
	{
		Bucket: 'bucket',
		Key: 'key',
		ResponseCacheControl: 'ResponseCacheControl',
		ResponseContentDisposition: 'ResponseContentDisposition',
		ResponseContentEncoding: 'ResponseContentEncoding',
		ResponseContentLanguage: 'ResponseContentLanguage',
		ResponseContentType: 'ResponseContentType',
		SSECustomerAlgorithm: 'SSECustomerAlgorithm',
		SSECustomerKey: 'SSECustomerKey',
		SSECustomerKeyMD5: 'SSECustomerKeyMD5',
	},
	expect.objectContaining({
		url: expect.objectContaining({
			href: 'https://bucket.s3.us-east-1.amazonaws.com/key?response-cache-control=ResponseCacheControl&response-content-disposition=ResponseContentDisposition&response-content-encoding=ResponseContentEncoding&response-content-language=ResponseContentLanguage&response-content-type=ResponseContentType',
		}),
		method: 'GET',
		headers: expect.objectContaining({
			authorization: expect.stringContaining('Signature'),
			host: 'bucket.s3.us-east-1.amazonaws.com',
			'x-amz-server-side-encryption-customer-algorithm': 'SSECustomerAlgorithm',
			'x-amz-server-side-encryption-customer-key': 'SSECustomerKey',
			'x-amz-server-side-encryption-customer-key-MD5': 'SSECustomerKeyMD5',
			'x-amz-content-sha256': EMPTY_SHA256,
			'x-amz-date': expect.stringMatching(/^\d{8}T\d{6}Z/),
			'x-amz-user-agent': expect.stringContaining('aws-amplify'),
		}),
	}),
	{
		status: 200,
		// all header names are already lowercased by transfer handlers
		headers: {
			...DEFAULT_RESPONSE_HEADERS,
			...getObjectResponseHeaders,
		},
		body: 'mockBody',
	},
	{
		DeleteMarker: true,
		AcceptRanges: 'types',
		Expiration: getObjectResponseHeaders['x-amz-expiration'],
		Restore: getObjectResponseHeaders['x-amz-restore'],
		LastModified: new Date(getObjectResponseHeaders['last-modified']),
		ContentLength: Number(getObjectResponseHeaders['content-length']),
		ETag: getObjectResponseHeaders.etag,
		ChecksumCRC32: getObjectResponseHeaders['x-amz-checksum-crc32'],
		ChecksumCRC32C: getObjectResponseHeaders['x-amz-checksum-crc32c'],
		ChecksumSHA1: getObjectResponseHeaders['x-amz-checksum-sha1'],
		ChecksumSHA256: getObjectResponseHeaders['x-amz-checksum-sha256'],
		MissingMeta: Number(getObjectResponseHeaders['x-amz-missing-meta']),
		VersionId: getObjectResponseHeaders['x-amz-version-id'],
		CacheControl: getObjectResponseHeaders['cache-control'],
		ContentDisposition: getObjectResponseHeaders['content-disposition'],
		ContentEncoding: getObjectResponseHeaders['content-encoding'],
		ContentLanguage: getObjectResponseHeaders['content-language'],
		ContentRange: getObjectResponseHeaders['content-range'],
		ContentType: getObjectResponseHeaders['content-type'],
		Expires: new Date(getObjectResponseHeaders.expires),
		WebsiteRedirectLocation:
			getObjectResponseHeaders['x-amz-website-redirect-location'],
		ServerSideEncryption:
			getObjectResponseHeaders['x-amz-server-side-encryption'],
		SSECustomerAlgorithm:
			getObjectResponseHeaders[
				'x-amz-server-side-encryption-customer-algorithm'
			],
		SSECustomerKeyMD5:
			getObjectResponseHeaders['x-amz-server-side-encryption-customer-key-md5'],
		SSEKMSKeyId:
			getObjectResponseHeaders['x-amz-server-side-encryption-aws-kms-key-id'],
		BucketKeyEnabled: true,
		StorageClass: getObjectResponseHeaders['x-amz-storage-class'],
		RequestCharged: getObjectResponseHeaders['x-amz-request-charged'],
		ReplicationStatus: getObjectResponseHeaders['x-amz-replication-status'],
		PartsCount: Number(getObjectResponseHeaders['x-amz-mp-parts-count']),
		TagCount: Number(getObjectResponseHeaders['x-amz-tagging-count']),
		ObjectLockMode: getObjectResponseHeaders['x-amz-object-lock-mode'],
		ObjectLockRetainUntilDate: new Date(
			getObjectResponseHeaders['x-amz-object-lock-retain-until-date']
		),
		ObjectLockLegalHoldStatus:
			getObjectResponseHeaders['x-amz-object-lock-legal-hold'],
		Metadata: {
			param1: 'value 1',
			param2: 'value 2',
		},
		Body: expect.objectContaining({
			text: expect.any(Function),
			blob: expect.any(Function),
			json: expect.any(Function),
		}),
		$metadata: expect.objectContaining({
			attempts: 1,
			requestId: MOCK_REQUEST_ID,
			extendedRequestId: MOCK_EXTENDED_REQUEST_ID,
			httpStatusCode: 200,
		}),
	},
];

export default [
	listObjectsV2HappyCase,
	// TODO: Error case does not work for now
	// listObjectsV2ErrorCase
	getObjectHappyCase,
];
