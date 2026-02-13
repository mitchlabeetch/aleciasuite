/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "uuid" {
	export function v1(
		options?: unknown,
		buffer?: unknown,
		offset?: number,
	): string;
	export function v3(
		name: string | unknown[],
		namespace: string | unknown[],
	): string;
	export function v4(
		options?: unknown,
		buffer?: unknown,
		offset?: number,
	): string;
	export function v5(
		name: string | unknown[],
		namespace: string | unknown[],
	): string;
	export function validate(uuid: string): boolean;
	export function version(uuid: string): number;
	export function parse(uuid: string): Uint8Array;
	export function stringify(arr: Uint8Array, offset?: number): string;
	export const NIL: string;
}
