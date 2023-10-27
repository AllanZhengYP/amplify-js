'use strict';
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var __spreadArray =
	(this && this.__spreadArray) ||
	function (to, from, pack) {
		if (pack || arguments.length === 2)
			for (var i = 0, l = from.length, ar; i < l; i++) {
				if (ar || !(i in from)) {
					if (!ar) ar = Array.prototype.slice.call(from, 0, i);
					ar[i] = from[i];
				}
			}
		return to.concat(ar || Array.prototype.slice.call(from));
	};
Object.defineProperty(exports, '__esModule', { value: true });
exports.allRNPublicPaths = void 0;
var publicPaths_1 = require('./publicPaths');
var RN = require('@aws-amplify/react-native');
exports.allRNPublicPaths = __spreadArray(
	__spreadArray([], publicPaths_1.allPublicPaths, true),
	[RN],
	false
);
