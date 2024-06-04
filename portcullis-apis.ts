import { Amplify } from 'aws-amplify';
import {
  fetchAuthSession,
  CredentialsAndIdentityIdProvider,
} from 'aws-amplify/auth';
import { list } from 'aws-amplify/storage'

type Permission = 'READ' | 'READWRITE' | 'WRITE';

interface LocationAccess {
  // Scope of storage location. For S3 service, it's the S3 path of the data to
  // which the access is granted.
  // Example: s3://MY-BUCKET-NAME/prefix/*
  readonly scope: string;
  // The type of access granted to your Storage data. Can be either of READ,
  // WRITE or READWRITE
  readonly permission: Permission;
}

interface AccessGrant extends LocationAccess {
  // The Amazon Resource Name (ARN) of an AWS IAM Identity Center application associated with your
  // Identity Center instance. If the grant includes an application ARN, the grantee can only access
  // the S3 data through this application.
  readonly applicationsArn?: string;
  // Parsed bucket name from the scope string. Example: 'MY-BUCKET-NAME'
  readonly bucket: string;
  // readonly region: string;
}

interface AWSCredentials {
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly sessionToken?: string;
  readonly expiration?: Date;
};

type CredentialsProvider = (options?: {
  forceRefresh?: boolean;
}) => Promise<AWSCredentials>;

type LocationCredentialsProvider = (options: {
  forceRefresh?: boolean;
  bucket: string;
  path: string;
  permission: Permission;
}) => Promise<AWSCredentials>;

interface ListLocationsInput {
  accountId: string;
  options: {
    nextToken?: string;
    // Default to 100; If > 1000, API will make multiple API calls.
    pageSize?: number;
    // Optional STS session provider overwriting any session configured in Amplify class.
    credentialsProvider?: CredentialsProvider;
    // Optional region overwriting S3 region configured in Amplify class.
    region?: string;
  };
}

interface ListLocationsOutput<T extends LocationAccess> {
  locations: T[];
  nextToken?: string;
}

interface ListLocations {
  (): Promise<ListLocationsOutput<LocationAccess>>;
}

declare const listCallerAccessGrants: (input: ListLocationsInput) => Promise<ListLocationsOutput<AccessGrant>>;

interface LocationCredentialsHandler {
  (input: LocationAccess): Promise<{credentials: AWSCredentials; scope?: string}>;
}

interface LocationAuthSessionsStore {
  // Get location-specific credentials. It uses a cache internally to optimize performance when
  // getting credentials for the same location. It will refresh credentials if they expire or
  // when forced to.
  getProvider: () => LocationCredentialsProvider
  // Invalidate cached credentials and force subsequent calls to get location-specific
  // credentials to throw. It also makes subsequent calls to `getCredentialsProviderForLocation`
  // to throw.
  destroy: () => void;
}

declare const createLocationCredentialsStore: (input: {
  handler: LocationCredentialsHandler;
}) => LocationAuthSessionsStore;

// From here, initializing StorageBrowser
interface CreateStorageBrowserInputHandlers {
  listLocations: ListLocations;
  getLocationCredentials: LocationCredentialsHandler;
}

interface CreateStorageBrowserInput {
  handlers: CreateStorageBrowserInputHandlers;
  // Omit options like primitives, actions, etc.
}

declare const createStorageBrowser: (input: CreateStorageBrowserInput) => JSX.Element;

declare const storageBrowserManagedAuthAdaptor: (input: {
  accountId: string;
  credentialsProvider: CredentialsProvider;
  region: string;
}) => CreateStorageBrowserInputHandlers;

const storageBrowserHandlers = storageBrowserManagedAuthAdaptor({
  accountId: 'accountId',
  credentialsProvider: async () => ({
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    sessionToken: 'sessionToken',
  }),
  region: 'region',
})

const storageBrowser = createStorageBrowser({
  handlers: storageBrowserHandlers,
});

// From here, called inside createStorageBrowser implementation
// create location credentials store
const locationCredentialsStore = createLocationCredentialsStore({
  handler: storageBrowserHandlers.getLocationCredentials
});

const credentialsProvider1 = locationCredentialsStore.getProvider();

declare const accessGrant: AccessGrant;
list({
  path: 'path/to/prefix',
  options: {
    locationCredentialsProvider: locationCredentialsStore.getProvider(),
    bucket: 'bucket',
    region: 'us-west-2'
  }
})

const { StorageBrowser } = createStorageBrowser({
  config: {
    listLocations: async () => ({
      locations: [{
        scope: 's3://bucket/a',
        permission: 'READ',
        type: 'OBJECT'
      }],
      nextToken: undefined
    }),
    // Must handle all the locations in listLocations();
    getLocationCredentials: async ({scope, permission}) => {
      if (scope === 's3://bucket/a' && permission.includes('READ')) {
        return {
          credentials: {
            secretAccessKey: 'key',
            accessKeyId: 'akid'
          },
        }
      } else {
        throw new Error('not authorized');
      }
    },
    //...
  }
});