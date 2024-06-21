// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// LRU implementation for Location Credentials Store
// O(n) for get and set for simplicity.

import { AWSCredentials } from '@aws-amplify/core/internals/utils';

import { Permission } from '../../providers/s3/types/options';

export interface CacheValue {
	credentials: AWSCredentials;
}

type S3Url = string;

/**
 * @internal
 */
export type CacheKey = `${S3Url}_${Permission}`;

/**
 * @internal
 */
export interface Cache {
	capacity: number;
	values: Map<CacheKey, CacheValue>;
}

/**
 * @internal
 */
export const createCache = (size: number): Cache => {
	// TODO(@AllanZhengYP)
	if (size <= 0) {
		throw new Error('Invalid Cache size');
	}

	return {
		capacity: size,
		values: new Map<CacheKey, CacheValue>(),
	};
};

/**
 * @internal
 */
export const setRecord = (
	cache: Cache,
	key: CacheKey,
	value: CacheValue,
): void => {
	if (cache.capacity === cache.values.size) {
		// Pop least used entry. The Map's key are in insertion order.
		// So last key is the last used.
		const [...keyArray] = cache.values.keys();
		cache.values.delete(keyArray.pop()!);
	}
	// Add latest used value to the cache.
	cache.values.set(key, value);
};

/**
 * @internal
 */
export const getValue = (cache: Cache, key: CacheKey): CacheValue | null => {
	if (cache.values.has(key)) {
		const value = cache.values.get(key)!;
		// remove and re-insert the read value
		cache.values.delete(key);
		cache.values.set(key, value);

		return value;
	}

	return null;
};
