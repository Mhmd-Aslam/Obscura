import { defineConfig } from 'vite';

export default defineConfig({
    // Base path is important for GitHub Pages if the repo is not at the root domain
    // Ideally, this should be '/<repo-name>/', but './' works for relative assets in most cases.
    base: '/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false
    },
    server: {
        open: true, // Auto-open browser
        port: 3000
    }
});
