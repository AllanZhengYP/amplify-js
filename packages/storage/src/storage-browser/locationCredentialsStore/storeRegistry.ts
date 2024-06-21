// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Permission } from '../../providers/s3/types/options';

import {
	Cache,
	CacheKey,
	CacheValue,
	createCache,
	getValue as getLruValue,
	setRecord as setLruRecord,
} from './lru';

const CREDENTIALS_STORE_DEFAULT_SIZE = 10;

/**
 * Keep all cache records for all instances of credentials store in a singleton
 * so we can reliably de-reference from the memory when we destroy a store
 * instance.
 */
const storeRegistry = new Map<symbol, Cache>();

interface CompositeCacheKey {
	scope: string;
	permission: Permission;
}

const getCacheKey = (compositeKey: CompositeCacheKey): CacheKey => {
	return `${compositeKey.scope}_${compositeKey.permission}`;
};

export const createStore = (size = CREDENTIALS_STORE_DEFAULT_SIZE) => {
	const storeInstanceSymbol = Symbol('LocationCredentialsStore');
	storeRegistry.set(storeInstanceSymbol, createCache(size));

	return storeInstanceSymbol;
};

export const setRecord = (input: {
	storeReference: symbol;
	key: CompositeCacheKey;
	value: CacheValue;
}): void => {
	const { storeReference, key, value } = input;
	if (!storeRegistry.has(storeReference)) {
		// TODO(@AllanZhengYP) Create storage error
		throw new Error(
			'Updating location-specific credentials in a destroyed store',
		);
	}
	const cache = storeRegistry.get(storeReference)!;
	const cacheKey = getCacheKey(key);
	setLruRecord(cache, cacheKey, value);
};

export const getValue = (input: {
	storeReference: symbol;
	key: CompositeCacheKey;
}): CacheValue | null => {
	const { storeReference, key } = input;
	if (!storeRegistry.has(storeReference)) {
		// TODO(@AllanZhengYP) Create storage error
		throw new Error(
			'Retrieving location-specific credentials in a destroyed store',
		);
	}
	const cache = storeRegistry.get(storeReference)!;
	const cacheKey = getCacheKey(key);

	return getLruValue(cache, cacheKey);
};

export const removeRecord = (input: {
	storeReference: symbol;
	key: CompositeCacheKey;
}): void => {
	const { storeReference, key } = input;
	if (!storeRegistry.has(storeReference)) {
		// TODO(@AllanZhengYP) Create storage error
		throw new Error(
			'Removing location-specific credentials from a destroyed store',
		);
	}
	const cache = storeRegistry.get(storeReference)!;
	const cacheKey = getCacheKey(key);
	cache.values.delete(cacheKey);
};

export const removeStore = (storeReference: symbol) => {
	storeRegistry.delete(storeReference);
};
