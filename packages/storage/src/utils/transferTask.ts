// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { TransferTask, TransferTaskState } from '../types/common';

type CreateTransferTaskOptions<Result> = {
	job: () => Promise<Result>;
	onCancel: () => void;
	onPause: () => void;
	onResume: () => void;
};

export const createTransferTask = <Result>({
	job,
	onCancel,
	onPause,
	onResume,
}: CreateTransferTaskOptions<Result>): TransferTask<Result> => {
	const state = TransferTaskState.IN_PROGRESS;
	const transferTask = Object.assign(
		// TODO(AllanZhengYP): prevent usage of .then .catch
		job()
			.then(res => {
				transferTask.state = TransferTaskState.SUCCESS;
				return res;
			})
			.catch(e => {
				transferTask.state = TransferTaskState.ERROR;
				throw e;
			}),
		{
			cancel: () => {
				const { state } = transferTask;
				if (
					state === TransferTaskState.CANCELED ||
					state === TransferTaskState.ERROR ||
					state === TransferTaskState.SUCCESS
				) {
					return;
				}
				onCancel();
				transferTask.state = TransferTaskState.CANCELED;
			},
			pause: () => {
				const { state } = transferTask;
				if (state !== TransferTaskState.IN_PROGRESS) {
					return;
				}
				onPause();
				transferTask.state = TransferTaskState.PAUSED;
			},
			resume: () => {
				const { state } = transferTask;
				if (state !== TransferTaskState.PAUSED) {
					return;
				}
				onResume();
				transferTask.state = TransferTaskState.IN_PROGRESS;
			},
			state,
		}
	);

	return transferTask;
};
