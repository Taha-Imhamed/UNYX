import { transformSync } from 'esbuild'

export default {
  process(sourceText, sourcePath) {
    const { code, map } = transformSync(sourceText, {
      loader: sourcePath.endsWith('.tsx') ? 'tsx' : 'ts',
      format: 'esm',
      sourcemap: true,
      sourcefile: sourcePath,
      target: 'node18',
    })
    return { code, map }
  },
}
