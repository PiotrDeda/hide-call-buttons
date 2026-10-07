// The parts of the Vendetta plugin API that Revenge Classic exposes and this plugin uses.

declare module '@vendetta/metro' {
	export function find(filter: (exports: any) => boolean): any
	export function findByName(name: string, defaultExp?: boolean): any
	export function findByProps(...props: string[]): any
}

declare module '@vendetta/metro/common' {
	export const React: typeof import('react')
	export const ReactNative: typeof import('react-native')
}

declare module '@vendetta/patcher' {
	type Unpatch = () => boolean

	export function after(
		func: string,
		parent: any,
		callback: (args: any[], ret: any) => unknown,
		once?: boolean,
	): Unpatch
	export function instead(
		func: string,
		parent: any,
		callback: (args: any[], orig: (...args: any[]) => any) => unknown,
		once?: boolean,
	): Unpatch
}

declare module '@vendetta/plugin' {
	export const storage: Record<string, any>
}

declare module '@vendetta/storage' {
	export function useProxy<T>(storage: T): T
}

declare module '@vendetta/ui/assets' {
	export function getAssetIDByName(name: string): number | undefined
}
