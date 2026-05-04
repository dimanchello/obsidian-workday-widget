import esbuild from 'esbuild';
import builtins from 'builtin-modules';

const isProd = process.argv[2] === 'production';

const buildOptions = {
    entryPoints: {
        'main':     'src/main.ts',
        'styles':   'styles.css',
        'manifest': 'manifest.json'
    },
    bundle: true,
    external: ['obsidian', 'electron', ...builtins],
    format: 'cjs',
    target: 'es2018',
    logLevel: 'info',
    sourcemap: isProd ? false : 'inline',
    treeShaking: true,
    outdir: 'dist',
    minify: isProd,
};

if (isProd) {
    esbuild
        .build(buildOptions)
        .catch(() => process.exit(1));
} else {
    esbuild
        .context(buildOptions)
        .then(ctx => {
            ctx.watch();
            console.log('Watching for changes...');
        })
        .catch(() => process.exit(1));
}
