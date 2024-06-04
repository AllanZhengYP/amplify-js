/************** Existing APIs ***************/
type TransferTaskState =
	| 'IN_PROGRESS'
	| 'PAUSED'
	| 'CANCELED'
	| 'SUCCESS'
	| 'ERROR';

type StorageItemWithPath = {
	/**
	 * Path of the object.
	 */
	path: string;

	/**
	 * Creation date of the object.
	 */
	lastModified?: Date;
	/**
	 * Size of the body in bytes.
	 */
	size?: number;
	/**
	 * An entity tag (ETag) is an opaque identifier assigned by a web server to a specific version of a resource found at
	 * a URL.
	 */
	eTag?: string;
	/**
	 * The user-defined metadata for the object uploaded to S3.
	 * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingMetadata.html#UserMetadata
	 */
	metadata?: Record<string, string>;

	bucket?: string;
};

interface TransferProgressEvent {
	transferredBytes: number;
	totalBytes?: number;
}

type BatchTaskState = TransferTaskState | 'QUEUEING';

type StorageUploadDataPayload = Blob | ArrayBufferView | ArrayBuffer | string;

interface AWSCredentials {
	accessKeyId: string;
	secretAccessKey: string;
	sessionToken?: string;
	expiration?: Date;
}
type CredentialsProvider = (options: {
	forceRefresh?: boolean;
}) => Promise<AWSCredentials>;

interface UploadDataWithPathInput {
	path: string | (({ identityId }: { identityId?: string }) => string);
	data: StorageUploadDataPayload;
	options?: {
		contentType?: string;
		contentDisposition?: string;
		contentEncoding?: string;
		useAccelerateEndpoint?: boolean;
		metadata?: Record<string, string>;
		region?: string; //<=== new option
		credentialsProvider?: CredentialsProvider; //<=== new option
		bucket?: string; //<=== new option
	};
}

/************** Batch API ***************/

interface BatchTask<T extends StorageItemWithPath[]> {
	cancel(message?: string): void;
	// result would reject if any of the individual task errors out.
	result: Promise<T>;
	// use taskStates to check individual task states to recover from error state
	taskStates: {
		bucket: string;
		remotePath: string;
		state: BatchTaskState;
	}[];
}

interface BatchProgressEvent {
	// TBD: this could be duplicated by bucket
	[remotePath: string]: TransferProgressEvent;
}

interface BatchUploadDataInput {
	inputs: UploadDataWithPathInput[];
	options?: {
		onProgress?: (progress: BatchProgressEvent) => void;
		onObjectComplete?: (object: StorageItemWithPath) => void;
	};
}

/************** DX ***************/

declare const batchUploadData: (
	input: BatchUploadDataInput
) => BatchTask<StorageItemWithPath[]>;

async function run() {
	const batchUploadDataTask = batchUploadData({
		// Not indexed by path to deduplicate because we don't want to indexed by path function
		inputs: [
			{
				path: 'test',
				data: new File(['test'], 'test.txt'),
				options: {
					contentType: 'text/plain',
					contentDisposition: 'inline',
					contentEncoding: 'gzip',
					useAccelerateEndpoint: true,
					metadata: {
						test: 'test',
					},
				},
			},
			{
				path: ({ identityId }) => `test2`,
				data: new File(['test2'], 'test2.txt'),
				options: {
					contentType: 'text/plain',
					contentDisposition: 'inline',
					contentEncoding: 'gzip',
					useAccelerateEndpoint: true,
					metadata: {
						test: 'test2',
					},
				},
			},
		],
		options: {
			onProgress: progress => {
				console.log(progress);
			},
		},
	});
	try {
		await batchUploadDataTask.result;
	} catch (e) {
		// restart a batch with unfinished task.
		const notCompletedPaths = batchUploadDataTask.taskStates
			.filter(({ state }) => state !== 'SUCCESS')
			.map(({ remotePath, bucket }) => remotePath);
	}
}

const batchUploadDataTask = batchUploadData({
	// Not indexed by path to deduplicate because we don't want to indexed by path function
	inputs: [
		{
			path: 'test',
			data: new File(['test'], 'test.txt'),
			options: {
				contentType: 'text/plain',
				contentDisposition: 'inline',
				contentEncoding: 'gzip',
				useAccelerateEndpoint: true,
				metadata: {
					test: 'test',
				},
			},
		},
		{
			path: ({ identityId }) => `test2`,
			data: new File(['test2'], 'test2.txt'),
			options: {
				contentType: 'text/plain',
				contentDisposition: 'inline',
				contentEncoding: 'gzip',
				useAccelerateEndpoint: true,
				metadata: {
					test: 'test2',
				},
			},
		},
	],
	options: {
		onProgress: progress => {
			console.log(progress);
			/**
			 * {
			 *   'test.txt': { transferredBytes: 1, totalBytes: 2 }
			 *   'test2.txt': { transferredBytes: 0, totalBytes: 2 }
			 * }
			 */
		},
	},
});
try {
	await batchUploadDataTask.result;
} catch (e) {
	// restart a batch with unfinished task.
	const notCompletedPaths = batchUploadDataTask.taskStates
		.filter(({ state }) => state !== 'SUCCESS')
		.map(({ remotePath, bucket }) => remotePath);
}
