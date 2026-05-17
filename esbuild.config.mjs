import esbuild from 'esbuild';
import builtins from 'builtin-modules';
import { copyFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const isProd = process.argv[2] === 'production';

const buildOptions = {
    entryPoints: ['src/main.ts'],
    bundle: true,
    external: ['obsidian', 'electron', ...builtins],
    format: 'cjs',
    target: 'es2018',
    logLevel: 'info',
    sourcemap: isProd ? false : 'inline',
    treeShaking: true,
    outdir: 'dist',
    outExtension: { '.js': '.js' },
    minify: isProd,
};

function copyAssets() {
    mkdirSync(resolve(__dirname, 'dist'), { recursive: true });
    copyFileSync(resolve(__dirname, 'manifest.json'), resolve(__dirname, 'dist', 'manifest.json'));
    copyFileSync(resolve(__dirname, 'styles.css'), resolve(__dirname, 'dist', 'styles.css'));
}

if (isProd) {
    esbuild
        .build(buildOptions)
        .then(() => copyAssets())
        .catch(() => process.exit(1));
} else {
    esbuild
        .context(buildOptions)
        .then((ctx) => {
            ctx.watch();
            copyAssets();
            console.log('Watching for changes...');
        })
        .catch(() => process.exit(1));
}
