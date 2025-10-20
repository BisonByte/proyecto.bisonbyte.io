import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'react',
    },
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/ts/main.tsx',
                'resources/ts/dashboard-designer.tsx',
            ],
            refresh: true,
        }),
        tailwindcss(),
    ],
});
