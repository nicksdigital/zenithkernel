/**
 * Simple development server for ZenithKernel Hello World app
 * Run with: node server.js or bun server.js
 */

import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.PORT || 3000;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

/**
 * Get MIME type for file extension
 */
function getMimeType(filePath) {
    const ext = extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Serve static files
 */
async function serveFile(filePath, res) {
    try {
        const fullPath = join(__dirname, filePath);
        
        // Check if file exists
        await stat(fullPath);
        
        // Read and serve file
        const content = await readFile(fullPath);
        const mimeType = getMimeType(filePath);
        
        res.writeHead(200, {
            'Content-Type': mimeType,
            'Cache-Control': 'no-cache'
        });
        res.end(content);
        
    } catch (error) {
        // File not found
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
    }
}

/**
 * Create HTTP server
 */
const server = createServer(async (req, res) => {
    const url = req.url === '/' ? '/index.html' : req.url;
    
    // Add CORS headers for development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Serve static files
    if (req.method === 'GET') {
        await serveFile(url, res);
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method not allowed');
    }
});

/**
 * Start server
 */
server.listen(PORT, () => {
    console.log('🚀 ZenithKernel Hello World Server Started!');
    console.log(`📍 Server running at: http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log('🎨 Features:');
    console.log('   • Tailwind CSS styling');
    console.log('   • Reactive state management');
    console.log('   • Component-based architecture');
    console.log('   • Beautiful glass-morphism design');
    console.log('\n💡 Open http://localhost:3000 in your browser to see the app!');
    console.log('🔄 Press Ctrl+C to stop the server\n');
});

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped gracefully');
        process.exit(0);
    });
});

export default server;
