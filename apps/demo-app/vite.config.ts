import { defineConfig } from 'vite';
import { resolve } from 'path';

// ZK file transformer using proper ZenithKernel parsers
function zenithKernelPlugin() {
  return {
    name: 'zenith-kernel-zk-files',
    transform(code: string, id: string) {
      // Handle .zk files
      if (id.endsWith('.zk')) {
        return {
          code: `
            // ZK Component: ${id}
            import { ZenithTemplateParser } from '@modules/Rendering/template-parser';
            import { ZenithHtmlTransformer } from '@modules/Rendering/zenith-html-transformer';

            export default function ZKComponent(props = {}) {
              const template = \`${code.replace(/`/g, '\\`')}\`;

              // Extract script and template sections
              const scriptMatch = template.match(/<script[^>]*>([\\s\\S]*?)<\\/script>/);
              const templateMatch = template.match(/<template[^>]*>([\\s\\S]*?)<\\/template>/);

              const scriptContent = scriptMatch ? scriptMatch[1] : '';
              const templateOnly = templateMatch ? templateMatch[1] : template.replace(/<script[^>]*>[\\s\\S]*?<\\/script>/g, '').trim();

              // Create component state
              let componentState = {
                count: 0,
                todos: [],
                newTodo: '',
                ...props
              };

              // Define component methods
              const componentMethods = {
                updateCount: function() {
                  componentState.count = (componentState.count || 0) + 1;
                  console.log('Count updated:', componentState.count);
                },

                addTodo: function() {
                  if (componentState.newTodo.trim()) {
                    componentState.todos.push({
                      id: Date.now(),
                      text: componentState.newTodo.trim(),
                      completed: false
                    });
                    componentState.newTodo = '';
                  }
                },

                toggleTodo: function(id) {
                  const todo = componentState.todos.find(t => t.id === id);
                  if (todo) {
                    todo.completed = !todo.completed;
                  }
                },

                deleteTodo: function(id) {
                  componentState.todos = componentState.todos.filter(t => t.id !== id);
                }
              };

              return {
                template: templateOnly,
                props,
                state: componentState,
                methods: componentMethods,
                async mount(element) {
                  if (!element) return;

                  try {
                    // Create render context
                    const context = {
                      ...componentState,
                      ...componentMethods,
                      // Helper functions for templates
                      zkVerify: async () => true,
                      ecsGet: () => null,
                      ecsHas: () => false,
                      ecsQuery: () => []
                    };

                    // Use ZenithKernel's proper parsers
                    const parser = new ZenithTemplateParser({
                      enableZKDirectives: true,
                      enableECSDirectives: true,
                      enableHydrationDirectives: true
                    });

                    // Parse the ZK template
                    const parsed = parser.parse(templateOnly);

                    // Transform to HTML using ZenithHtmlTransformer
                    const transformer = new ZenithHtmlTransformer(context, {
                      enableZKVerification: false,
                      enableECSBinding: false,
                      enableHydrationConfig: true,
                      fallbackToPlaceholder: true,
                      debugMode: true
                    });

                    // Render the component
                    const html = await transformer.transform(parsed);
                    element.innerHTML = html;

                    // Bind event handlers
                    this.bindEvents(element);

                    console.log('✅ ZK Component rendered:', { parsed, html, state: componentState });

                  } catch (error) {
                    console.error('❌ ZK Component render error:', error);
                    element.innerHTML = \`
                      <div class="p-4 bg-red-900/20 border border-red-500 rounded-lg">
                        <div class="text-red-400 font-semibold">ZK Component Error</div>
                        <div class="text-red-300 text-sm mt-2">\${error.message}</div>
                      </div>
                    \`;
                  }
                },

                bindEvents(element) {
                  // Bind click events
                  const buttons = element.querySelectorAll('button');
                  buttons.forEach(button => {
                    const onclick = button.getAttribute('onclick');
                    if (onclick) {
                      button.addEventListener('click', (e) => {
                        e.preventDefault();
                        const methodName = onclick.replace('()', '');
                        if (componentMethods[methodName]) {
                          componentMethods[methodName]();
                          // Re-render after state change
                          this.mount(element);
                        }
                      });
                      button.removeAttribute('onclick');
                    }
                  });
                }
              };
            }
          `,
          map: null
        };
      }
      return null;
    }
  };
}



export default defineConfig({
  plugins: [
    zenithKernelPlugin()
  ],
  root: '.',
  publicDir: 'public',
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@islands': resolve(__dirname, './src/islands'),
      '@stores': resolve(__dirname, './src/stores'),
      '@utils': resolve(__dirname, './src/utils'),
      '@zenithcore': resolve(__dirname, '../../packages/zenith-core/src'),
      '@zenithkernel': resolve(__dirname, '../../packages/zenith-runtime/src'),
      '@core': resolve(__dirname, '../../packages/zenith-core/src/core'),
      '@modules': resolve(__dirname, '../../packages/zenith-core/src/modules'),
      '@runtime': resolve(__dirname, '../../packages/zenith-runtime/src'),
      '@sdk': resolve(__dirname, '../../packages/zenith-sdk/src')
    }
  },

  esbuild: {
    target: 'es2022',
    format: 'esm',
    platform: 'browser',
    jsx: 'automatic',
    jsxImportSource: '@modules/Rendering'
  },

  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },

  server: {
    port: 3000,
    host: true,
    open: true
  },

  optimizeDeps: {
    include: ['@zenithcore/core', '@zenithcore/sdk', '@zenithcore/runtime']
  }
});
