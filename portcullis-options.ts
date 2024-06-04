import { fetchAuthSession } from 'aws-amplify/auth';
// bucket, prefix or object
type LocationName = string;

type Permission = "READ" | "READWRITE" | "WRITE";

type CredentialsProvider = (options?: {
  forceRefresh?: boolean;
}) => Promise<AWSCredentials>;

const cp: CredentialsProvider = async (options?: {
  forceRefresh?: boolean;
}) => {return (await fetchAuthSession(options)).credentials ?? {}}

interface ListLocationsInput {
  nextToken?: string;
  maxResults?: number;
}

interface ListLocationsOutput {
  nextToken: string | undefined;
  result: S3Location[];
}

interface ListLocationsHandler {
	(input?: ListLocationsInput): Promise<ListLocationsOutput>;
}

interface FetchLocationAccessHandler {
	(input: S3Location): Promise<AWSCredentials>;
}

interface LocationsStoreBaseInput {
  listLocationsHandler: ListLocationsHandler;
  fetchLocationAccessHandler: FetchLocationAccessHandler
}

interface LocationMetadata extends S3Location {
	readonly getCredentials: CredentialsProvider,
	readonly bucket: string,
}

declare const memoizeCredentialsProvider: <T>(
	provider: (input: T) => Promise<AWSCredentials>,
	fixedInput: T
) => CredentialsProvider;

declare const parseS3Url: (s3Url: string) => { bucket: string; key: string };

interface LocationsStore {
	/**
	 * Attempt to load given count of locations. It calls underlying handler
	 * repeatedly until either the handler returns empty next token or the count
	 * has been met. The loaded locations will be appended to previously stored
	 * locations.
	 */
	load: (input?: { count?: number }) => Promise<void>;

	/**
	 * Reset stored locations list and associated credentials providers.
	 * The next load call will force refresh the credentials.
	 */
	reset: () => void;

	/**
	 * Access all the currently stored locations.
	 */
	getLocations: () => LocationMetadata[];
}

const getBaseLocationsStore = ({ listLocationsHandler, fetchLocationAccessHandler }: LocationsStoreBaseInput): LocationsStore => {
  let currentNextToken: string | undefined;
	let locations: LocationMetadata[] = [];

	return {
		async load(input?: { count?: number }): Promise<void> {
			const { count = 100 } = input || {};
			const { result, nextToken } = await listLocationsHandler({
				nextToken: currentNextToken,
				maxResults: count,
			});
			currentNextToken = nextToken;
			const locationMetadatas = result.map((location) =>{
				return {
					...location,
					getCredentials: memoizeCredentialsProvider(fetchLocationAccessHandler, location),
					bucket: parseS3Url(location.s3Prefix).bucket,
				}
			});
			locations.push(...locationMetadatas);
			if (nextToken && locations.length < count) {
				await this.load({ count: count - locations.length });
			}
		},

		reset(): void {
			locations = [];
		},
	
		getLocations(): LocationMetadata[] {
			// TODO: Freeze the returned locations
			return locations;
		}
	}
}

interface LocationsStoreInput {
  region: string,
	accountId: string,
	credentialsProvider: CredentialsProvider,
	durationSeconds?: number,
	applicationArn?: string
}

const getLocationsStore = ({
	region,
	accountId,
	credentialsProvider,
	durationSeconds,
	applicationArn
}: LocationsStoreInput): LocationsStore => {
	const baseStore = getBaseLocationsStore({
		listLocationsHandler: (input) => {
			return listS3Locations({
				region,
				accountId,
				credentialsProvider,
				...input,
			});
		},
		fetchLocationAccessHandler: (location) => {
			return fetchS3LocationAccess({
				region,
				accountId,
				credentialsProvider,
				location,
				durationSeconds,
				applicationArn
			});
		},
	});

	return {
		load: baseStore.load,
		reset: baseStore.reset,
		getLocations: baseStore.getLocations,
	}
}

type BaseUploadInput = {
  paths: { path: string; onProgress: (event: any) => void }[];
  options: {
    bucket: string;
    credentials: {};
    region: string;
  };
};

type UploadFiles = (input: BasUploadInput) => Promise<{ result: any[] }>;

interface ListProvider<T> {
  getSnapshot: () => T;
  handleList: (input: ListLocationsInput) => void;
  subscribe: (onStoreChange: () => void) => () => void;
}

// AWS Managed Auth
interface AccessGrantsConfig {
  accountId: string;
  credentialsProvider: CredentialsProvider;
  region: string;
}

type CreateSBManaged = (input: {
  config: { accessGrants: AccessGrantsConfig };
}) => JSX.Element;

type ListLocations = List<S3Location>;

// custom auth
type CreateSBCustomAuth = (input: {
  config: { listLocations: ListLocations };
}) => JSX.Element;

// Amplify Auth
type CreateSBAmplifyAuth = () => JSX.Element;

type GetLocationCredentials = (input: {
  forceRefresh: boolean;
}) => Promise<AWSCredentials>;

// interface LocationMetadata {
//   // authZ credentials
//   getLocationCredentials: GetLocationCredentials;
//   permission: "READ" | "READWRITE" | "WRITE";
// }

interface CreateLocationsProviderInput {
  accountId: string;
  credentialsProvider: CredentialsProvider;
  region: string;
}

type LocationsProvider = (input: {
  maxResults?: number;
  nextToken?: string;
}) => Promise<{ locations: S3Location[]; nextToken: string | undefined }>;

// AWS Managed Auth and Custom Auth Use Cases
type CreateSBLocationsProvider = (input: {
  config: { locationsProvider: LocationsProvider };
}) => JSX.Element;