import { AWSCredentials } from '@aws-amplify/core/internals/utils';

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
  readonly applicationArn?: string;
  // Parsed bucket name from the scope string. Example: 'MY-BUCKET-NAME'
  readonly bucket: string;
  // readonly region: string;
}

export type CredentialsProvider = (options?: {
  forceRefresh?: boolean;
}) => Promise<AWSCredentials>;

export type LocationCredentialsProvider = (options: {
  forceRefresh?: boolean;
	locations: { bucket: string, path: string }[]
  permission: Permission;
}) => Promise<AWSCredentials>;

export interface ListCallerAccessGrantsInput {
  accountId: string;
  options: {
    // Required. Need to make optional to align is other APIs if we plan to publish it
    credentialsProvider: CredentialsProvider;
    // Required. Need to make optional to align is other APIs if we plan to publish it
    region: string;
    nextToken?: string;
    // Default to 100; If > 1000, API will make multiple API calls.
    pageSize?: number;
  };
}

export interface ListCallerAccessGrantsOutput
  extends ListLocationsOutput<AccessGrant> {}

export interface ListLocationsOutput<T extends LocationAccess> {
  locations: T[];
  nextToken?: string;
}

export interface ListLocations {
  (): Promise<ListLocationsOutput<LocationAccess>>;
}

export interface LocationCredentialsHandler {
  (
    input: LocationAccess,
  ): Promise<{ credentials: AWSCredentials; scope?: string }>;
}

export interface LocationCredentialsStore {
  // Get location-specific credentials. It uses a cache internally to optimize performance when
  // getting credentials for the same location. It will refresh credentials if they expire or
  // when forced to.
	// If specific credentials scope `forLocation` is omitted, the store will attempt to resolve
	// locations-specific credentials from the input bucket and full path.
  getProvider: (forLocation?: { scope: string, permission: Permission }) => LocationCredentialsProvider;
  // Invalidate cached credentials and force subsequent calls to get location-specific
  // credentials to throw. It also makes subsequent calls to `getCredentialsProviderForLocation`
  // to throw.
  destroy: () => void;
}
