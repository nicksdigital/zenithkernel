/**
 * Enhanced Vite Development Server for ZenithKernel Hydra Runtime
 * 
 * Provides:
 * - Live island preview
 * - Hot module replacement
 * - Island development tools
 * - Real-time performance monitoring
 */

import { createServer, ViteDevServer } from 'vite';
import { hydraPlugin } from '../plugins/vite-plugin-hydra';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface HydraDevServerOptions {
  port?: number;
  host?: string;
  open?: boolean;
  enableDevTools?: boolean;
  enableHMR?: boolean;
}

export class HydraDevServer {
  private viteServer?: ViteDevServer;
  private expressApp: express.Application;
  private options: Required<HydraDevServerOptions>;

  constructor(options: HydraDevServerOptions = {}) {
    this.options = {
      port: 3000,
      host: 'localhost',
      open: true,
      enableDevTools: true,
      enableHMR: true,
      ...options
    };
    
    this.expressApp = express();
    this.setupMiddleware();
  }

  private setupMiddleware() {
    // JSON parsing middleware
    this.expressApp.use(express.json());
    
    // CORS for development
    this.expressApp.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Static assets
    this.expressApp.use('/assets', express.static(path.join(__dirname, '../assets')));
  }

  async start(): Promise<void> {
    try {
      // Create Vite server
      this.viteServer = await createServer({
        root: process.cwd(),
        server: {
          middlewareMode: true,
          hmr: this.options.enableHMR ? {
            port: this.options.port + 1
          } : false
        },
        plugins: [
          hydraPlugin({
            hmr: this.options.enableHMR,
            generateRegistry: true,
            dev: true
          })
        ],
        optimizeDeps: {
          include: [
            'react',
            'react-dom'
          ]
        }
      });

      // Add Vite middleware to Express
      this.expressApp.use(this.viteServer.ssrFixStacktrace);
      this.expressApp.use(this.viteServer.middlewares);

      // Setup development routes
      this.setupDevRoutes();

      // Start the server
      const server = this.expressApp.listen(this.options.port, this.options.host, () => {
        console.log(`
🌊 ZenithKernel Hydra Dev Server`);
        console.log(`📡 Local:    http://${this.options.host}:${this.options.port}`);
        console.log(`🏝️  Islands:  http://${this.options.host}:${this.options.port}/dev/islands`);
        console.log(`🛠️  DevTools: http://${this.options.host}:${this.options.port}/dev`);
        console.log(`
📝 Available endpoints:`);
        console.log(`   GET  /api/hydra/islands        - List all islands`);
        console.log(`   GET  /api/hydra/islands/:name  - Get island details`);
        console.log(`   GET  /dev                     - Development dashboard`);
        console.log(`   GET  /dev/islands             - Island playground`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.stop());
      process.on('SIGINT', () => this.stop());
      
    } catch (error) {
      console.error('Failed to start Hydra dev server:', error);
      process.exit(1);
    }
  }

  private setupDevRoutes() {
    if (!this.options.enableDevTools) return;

    // Development dashboard
    this.expressApp.get('/dev', (req, res) => {
      res.send(this.generateDashboardHTML());
    });

    // Island playground
    this.expressApp.get('/dev/islands', (req, res) => {
      res.send(this.generateIslandPlaygroundHTML());
    });

    // Island preview endpoint
    this.expressApp.get('/dev/islands/:name/preview', async (req, res) => {
      const { name } = req.params;
      const props = req.query.props ? JSON.parse(req.query.props as string) : {};
      const context = req.query.context ? JSON.parse(req.query.context as string) : { peerId: 'dev-preview' };
      
      res.send(this.generateIslandPreviewHTML(name, props, context));
    });

    // Performance monitoring endpoint
    this.expressApp.get('/api/hydra/performance', (req, res) => {
      res.json({
        timestamp: Date.now(),
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        islands: {
          // This would be populated by the runtime
          registered: 0,
          hydrated: 0,
          errors: 0
        }
      });
    });
  }

  private generateDashboardHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌊 ZenithKernel Hydra DevTools</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        .header {
            text-align: center;
            margin-bottom: 3rem;
            color: white;
        }
        .header h1 {
            font-size: 3rem;
            margin-bottom: 0.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        .cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 48px rgba(0,0,0,0.15);
        }
        .card h3 {
            color: #667eea;
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        .card p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 1.5rem;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .status {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
            background: rgba(255,255,255,0.1);
            padding: 1rem;
            border-radius: 8px;
            color: white;
        }
        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #4ade80;
            box-shadow: 0 0 8px #4ade80;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .api-endpoints {
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 1.5rem;
            color: white;
        }
        .api-endpoints h3 {
            margin-bottom: 1rem;
            color: #fbbf24;
        }
        .endpoint {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.5rem;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9rem;
        }
        .method {
            background: #10b981;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: bold;
            min-width: 60px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌊 ZenithKernel Hydra DevTools</h1>
            <p>Development environment for Hydra Islands</p>
        </div>
        
        <div class="status">
            <div class="status-indicator"></div>
            <span>Hydra Runtime is active • HMR enabled • ${new Date().toLocaleTimeString()}</span>
        </div>
        
        <div class="cards">
            <div class="card">
                <h3>🏝️ Island Playground</h3>
                <p>Interactive playground to test and preview your Hydra Islands with different props and contexts.</p>
                <a href="/dev/islands" class="btn">Open Playground</a>
            </div>
            
            <div class="card">
                <h3>📊 Performance Monitor</h3>
                <p>Real-time monitoring of island hydration performance, memory usage, and error tracking.</p>
                <button class="btn" onclick="openPerformanceMonitor()">View Metrics</button>
            </div>
            
            <div class="card">
                <h3>🔍 Registry Inspector</h3>
                <p>Browse all registered islands, their metadata, dependencies, and current status.</p>
                <button class="btn" onclick="openRegistryInspector()">Inspect Registry</button>
            </div>
            
            <div class="card">
                <h3>🧪 ZK Proof Tester</h3>
                <p>Test zero-knowledge proof verification with different proof formats and trust levels.</p>
                <button class="btn" onclick="openZKTester()">Test ZK Proofs</button>
            </div>
        </div>
        
        <div class="api-endpoints">
            <h3>📡 API Endpoints</h3>
            <div class="endpoint">
                <span class="method">GET</span>
                <span>/api/hydra/islands</span>
                <span>- List all discovered islands</span>
            </div>
            <div class="endpoint">
                <span class="method">GET</span>
                <span>/api/hydra/islands/:name</span>
                <span>- Get detailed island information</span>
            </div>
            <div class="endpoint">
                <span class="method">GET</span>
                <span>/api/hydra/performance</span>
                <span>- Runtime performance metrics</span>
            </div>
            <div class="endpoint">
                <span class="method">GET</span>
                <span>/dev/islands/:name/preview</span>
                <span>- Preview island with custom props</span>
            </div>
        </div>
    </div>
    
    <script>
        function openPerformanceMonitor() {
            window.open('/dev/performance', '_blank');
        }
        
        function openRegistryInspector() {
            fetch('/api/hydra/islands')
                .then(r => r.json())
                .then(data => {
                    const popup = window.open('', '_blank', 'width=800,height=600');
                    popup.document.write(
                        '<pre>' + JSON.stringify(data, null, 2) + '</pre>'
                    );
                });
        }
        
        function openZKTester() {
            alert('ZK Proof Tester - Coming soon!');
        }
        
        // Auto-refresh status
        setInterval(() => {
            document.querySelector('.status span').textContent = 
                `Hydra Runtime is active • HMR enabled • ${new Date().toLocaleTimeString()}`;
        }, 1000);
    </script>
</body>
</html>
    `;
  }

  private generateIslandPlaygroundHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏝️ Island Playground - ZenithKernel</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            color: #1a202c;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header h1 {
            font-size: 1.5rem;
            margin-bottom: 0.25rem;
        }
        .header p {
            opacity: 0.9;
            font-size: 0.9rem;
        }
        .playground {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
        .sidebar {
            width: 350px;
            background: white;
            border-right: 1px solid #e2e8f0;
            padding: 1.5rem;
            overflow-y: auto;
        }
        .preview {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .preview-header {
            background: #edf2f7;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .preview-content {
            flex: 1;
            padding: 2rem;
            background: white;
            overflow: auto;
        }
        .form-group {
            margin-bottom: 1.5rem;
        }
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #374151;
        }
        .form-group select,
        .form-group textarea,
        .form-group input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 0.9rem;
        }
        .form-group textarea {
            min-height: 100px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.8rem;
        }
        .btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            width: 100%;
        }
        .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .island-preview {
            border: 2px dashed #e2e8f0;
            border-radius: 8px;
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            font-style: italic;
        }
        .error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
        }
        .success {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #16a34a;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏝️ Island Playground</h1>
        <p>Test and preview your Hydra Islands with custom props and contexts</p>
    </div>
    
    <div class="playground">
        <div class="sidebar">
            <div class="form-group">
                <label for="islandSelect">Select Island:</label>
                <select id="islandSelect">
                    <option value="">Choose an island...</option>
                    <option value="ECSCounterIsland">ECS Counter Island</option>
                    <option value="HydraStatusIsland">Hydra Status Island</option>
                    <option value="HydraRegistryIsland">Hydra Registry Island</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="propsInput">Props (JSON):</label>
                <textarea id="propsInput" placeholder='{
  "label": "My Counter",
  "initialValue": 10,
  "step": 2
}'></textarea>
            </div>
            
            <div class="form-group">
                <label for="contextInput">Context (JSON):</label>
                <textarea id="contextInput" placeholder='{
  "peerId": "dev-user-123",
  "zkProof": "zk:dev-proof",
  "trustLevel": "local"
}'>{
  "peerId": "playground-user"
}</textarea>
            </div>
            
            <div class="form-group">
                <label for="strategySelect">Hydration Strategy:</label>
                <select id="strategySelect">
                    <option value="immediate">Immediate</option>
                    <option value="visible">Visible</option>
                    <option value="interaction">Interaction</option>
                    <option value="idle">Idle</option>
                    <option value="manual">Manual</option>
                </select>
            </div>
            
            <button class="btn" onclick="previewIsland()">🔄 Preview Island</button>
        </div>
        
        <div class="preview">
            <div class="preview-header">
                <span id="previewTitle">No island selected</span>
                <button class="btn" style="width: auto; padding: 0.5rem 1rem; font-size: 0.8rem;" onclick="refreshPreview()">🔄 Refresh</button>
            </div>
            
            <div class="preview-content">
                <div id="messages"></div>
                <div class="island-preview" id="islandPreview">
                    Select an island from the sidebar to begin
                </div>
            </div>
        </div>
    </div>
    
    <script type="module">
        // Import Hydra runtime
        import { hydrateLocalHydra, registerIsland } from '/src/lib/hydra-runtime.ts';
        
        window.previewIsland = async function() {
            const islandName = document.getElementById('islandSelect').value;
            const propsText = document.getElementById('propsInput').value;
            const contextText = document.getElementById('contextInput').value;
            const strategy = document.getElementById('strategySelect').value;
            
            if (!islandName) {
                showMessage('Please select an island', 'error');
                return;
            }
            
            try {
                const props = propsText ? JSON.parse(propsText) : {};
                const context = JSON.parse(contextText);
                
                // Clear previous preview
                const previewEl = document.getElementById('islandPreview');
                previewEl.innerHTML = '';
                previewEl.className = 'island-preview';
                previewEl.id = 'island-preview-target';
                
                // Update title
                document.getElementById('previewTitle').textContent = 
                    `${islandName} (${strategy})`;
                
                showMessage(`Loading ${islandName} with ${strategy} strategy...`, 'success');
                
                // Hydrate the island
                await hydrateLocalHydra('island-preview-target', islandName, context);
                
                showMessage(`✅ Successfully loaded ${islandName}`, 'success');
                
            } catch (error) {
                console.error('Preview error:', error);
                showMessage(`❌ Failed to load island: ${error.message}`, 'error');
            }
        };
        
        window.refreshPreview = function() {
            window.previewIsland();
        };
        
        function showMessage(text, type) {
            const messagesEl = document.getElementById('messages');
            const messageEl = document.createElement('div');
            messageEl.className = type;
            messageEl.textContent = text;
            
            messagesEl.innerHTML = '';
            messagesEl.appendChild(messageEl);
            
            // Auto-remove success messages
            if (type === 'success') {
                setTimeout(() => {
                    if (messageEl.parentNode) {
                        messageEl.remove();
                    }
                }, 3000);
            }
        }
        
        // Load example props based on island selection
        document.getElementById('islandSelect').addEventListener('change', function(e) {
            const examples = {
                'ECSCounterIsland': '{
  "label": "Dev Counter",
  "initialValue": 5,
  "step": 1
}',
                'HydraStatusIsland': '{
  "title": "Development Status",
  "showConnectionInfo": true
}',
                'HydraRegistryIsland': '{
  "title": "Registry Explorer",
  "showDetails": true,
  "allowActions": false
}'
            };
            
            const propsInput = document.getElementById('propsInput');
            if (examples[e.target.value]) {
                propsInput.value = examples[e.target.value];
            }
        });
    </script>
</body>
</html>
    `;
  }

  private generateIslandPreviewHTML(name: string, props: any, context: any): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview: ${name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 2rem;
            background: #f8fafc;
        }
        .preview-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .preview-header {
            background: #667eea;
            color: white;
            padding: 1rem 1.5rem;
        }
        .preview-content {
            padding: 2rem;
        }
        .meta {
            background: #f1f5f9;
            padding: 1rem;
            margin-bottom: 1rem;
            border-radius: 6px;
            font-size: 0.9rem;
        }
        .meta h4 {
            margin: 0 0 0.5rem 0;
            color: #374151;
        }
        .meta pre {
            margin: 0;
            background: white;
            padding: 0.5rem;
            border-radius: 4px;
            overflow: auto;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="preview-header">
            <h1>🏝️ ${name} Preview</h1>
            <p>Standalone island preview</p>
        </div>
        
        <div class="preview-content">
            <div class="meta">
                <h4>Props:</h4>
                <pre>${JSON.stringify(props, null, 2)}</pre>
            </div>
            
            <div class="meta">
                <h4>Context:</h4>
                <pre>${JSON.stringify(context, null, 2)}</pre>
            </div>
            
            <div id="island-container"></div>
        </div>
    </div>
    
    <script type="module">
        import { hydrateLocalHydra } from '/src/lib/hydra-runtime.ts';
        
        try {
            await hydrateLocalHydra('island-container', '${name}', ${JSON.stringify(context)});
        } catch (error) {
            document.getElementById('island-container').innerHTML = 
                `<div style="color: red; padding: 1rem; background: #fef2f2; border-radius: 6px;">` +
                `Error loading island: ${error.message}</div>`;
        }
    </script>
</body>
</html>
    `;
  }

  async stop(): Promise<void> {
    if (this.viteServer) {
      await this.viteServer.close();
    }
    console.log('
🌊 Hydra Dev Server stopped');
    process.exit(0);
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new HydraDevServer({
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost'
  });
  
  server.start().catch(console.error);
}

export default HydraDevServer;
