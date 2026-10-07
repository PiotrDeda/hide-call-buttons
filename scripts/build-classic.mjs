// Builds Revenge Classic (Vendetta API) bundles from `plugins/<name>/classic`.
// Output: plugins/<name>/build/classic/{manifest.json,index.js}

import { createHash } from 'node:crypto'
import { existsSync, readdirSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { extname } from 'node:path'
import { transform as swcTransform } from '@swc/core'
import { rolldown } from 'rolldown'

const PluginsDir = 'plugins'
const JsxRuntimeId = '\0classic-jsx-runtime'

/** Maps an external module to the global expression the Classic loader exposes. */
function globalFor(id) {
	if (id === 'react') return 'vendetta.metro.common.React'
	if (id.startsWith('@vendetta/')) return id.slice(1).replaceAll('/', '.')
	throw new Error(`No global for external module: ${id}`)
}

const isExternal = id => id === 'react' || id.startsWith('@vendetta/')

/** Revenge Classic exposes no JSX runtime, so JSX calls go through `React.createElement`. */
const jsxRuntimePlugin = {
	name: 'classic-jsx-runtime',
	resolveId(id) {
		if (id === 'react/jsx-runtime' || id === 'react/jsx-dev-runtime')
			return JsxRuntimeId
	},
	load(id) {
		if (id !== JsxRuntimeId) return
		return `import { createElement, Fragment } from 'react'
export { Fragment }
export function jsx(type, props, key) {
	return createElement(type, key === undefined ? props : { ...props, key })
}
export const jsxs = jsx`
	},
}

/** Same SWC settings as `@revenge-mod/plugin-cli`, which match Hermes. */
const hermesSwcPlugin = {
	name: 'hermes-swc',
	async transform(code, id) {
		if (!/\.[jt]sx?$/.test(id) || id.includes('node_modules')) return null

		const ext = extname(id)
		const ts = ext.includes('ts')
		const result = await swcTransform(code, {
			filename: id,
			jsc: {
				transform: { react: { runtime: 'automatic' } },
				parser: ts
					? { syntax: 'typescript', tsx: ext.endsWith('x') }
					: { syntax: 'ecmascript', jsx: ext.endsWith('x') },
			},
			env: {
				targets: 'fully supports es6',
				include: [
					'transform-arrow-functions',
					'transform-async-generator-functions',
					'transform-block-scoping',
					'transform-classes',
					'transform-duplicate-named-capturing-groups-regex',
					'transform-named-capturing-groups-regex',
				],
				exclude: [
					'transform-async-to-generator',
					'transform-exponentiation-operator',
					'transform-logical-assignment-operators',
					'transform-nullish-coalescing-operator',
					'transform-numeric-separator',
					'transform-object-rest-spread',
					'transform-optional-catch-binding',
					'transform-optional-chaining',
					'transform-parameters',
					'transform-template-literals',
				],
			},
		})

		return { code: result.code, map: result.map ?? null }
	},
}

const names = process.argv.slice(2)

for (const name of names.length ? names : readdirSync(PluginsDir)) {
	const dir = `${PluginsDir}/${name}/classic`
	const manifestPath = `${dir}/manifest.json`
	if (!existsSync(manifestPath)) continue

	const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

	const bundle = await rolldown({
		input: `${dir}/${manifest.main}`,
		platform: 'neutral',
		external: isExternal,
		plugins: [jsxRuntimePlugin, hermesSwcPlugin],
		transform: { target: 'es2020' },
		onwarn(warning, warn) {
			if (warning.code === 'MISSING_NAME_OPTION_FOR_IIFE_EXPORT') return
			warn(warning)
		},
	})

	const { output } = await bundle.generate({
		format: 'iife',
		globals: globalFor,
		exports: 'named',
		esModule: false,
		minify: true,
	})
	await bundle.close()

	// The loader evaluates `vendetta => { return <code> }`, so the bundle must be one expression.
	const code = output[0].code.trim()
	if (!code.startsWith('(function'))
		throw new Error(`${name}: bundle is not an IIFE expression`)

	const outDir = `${PluginsDir}/${name}/build/classic`
	await mkdir(outDir, { recursive: true })
	await writeFile(`${outDir}/index.js`, code, 'utf8')

	manifest.main = 'index.js'
	manifest.hash = createHash('sha256').update(code).digest('hex')
	await writeFile(`${outDir}/manifest.json`, JSON.stringify(manifest), 'utf8')

	console.log(`✓ Built Classic bundle for ${name}`)
}
