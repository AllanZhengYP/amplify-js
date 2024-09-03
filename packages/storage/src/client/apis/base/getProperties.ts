// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import {
	getProperties as getPropertiesFoundation,
	GetPropertiesInput as GetPropertiesFoundationInput,
	GetPropertiesOutput as GetPropertiesFoundationOutput,
} from '../../../foundation/apis';

export type GetPropertiesInput = Omit<
	GetPropertiesFoundationInput,
	'dependencies'
>;

export type GetPropertiesOutput = GetPropertiesFoundationOutput;

export const getProperties = async ({
	input,
	config,
}: GetPropertiesInput): Promise<GetPropertiesOutput> => {
	return getPropertiesFoundation({
		input,
		config,
		dependencies: {
			xmlBodyParser: () => {
				// TODO
			},
			transferHandler: () => {
				// TODO
			}
		},
	});
};
