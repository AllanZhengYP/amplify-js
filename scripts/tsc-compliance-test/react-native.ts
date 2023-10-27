// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { allPublicPaths } from './publicPaths';
import * as RN from '@aws-amplify/react-native';

export const allRNPublicPaths = [...allPublicPaths, RN];
