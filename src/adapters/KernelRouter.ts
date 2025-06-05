import express from "express";
import { routeMap } from "../decorators/HttpRoute";
import { validationMap } from "../decorators/ValidateBody";
import { generateOpenAPISpec } from "../utils/openapi";

// ../ts-ignore
import swaggerUiDist from "swagger-ui-dist";
import { WebSocketServer } from "ws";
import path from "path";

let wsClients: Set<WebSocket> = new Set();

export class KernelRouter {
    private app = express();
    private wss?: WebSocketServer;

    public broadcastSystemLoad(systemName: string) {
        this.broadcast("system:loaded", { name: systemName, time: Date.now() });
    }

    public broadcastSystemUnload(systemName: string) {
        this.broadcast("system:unloaded", { name: systemName, time: Date.now() });
    }

    constructor() {
        this.app.use(express.json());
    }

    private notifyDocsUpdate() {
        this.broadcast("docs-update");
    }

    mountSystemRoutes(systemInstance: any) {
        const ctor = systemInstance.constructor;
        const routes = routeMap.get(ctor);
        if (!routes) return;

        console.log(`🔗 Auto-routing: ${ctor.name}`);
        console.log(routes);

        for (const route of routes) {
            const handler = systemInstance[route.handlerName].bind(systemInstance);

            this.app.get("/admin", (_, res) => {
                res.sendFile(path.join(__dirname, "../modules/AdminUI/AdminClient.html"));
            });
            // ../ts-ignore
            this.app[route.method.toLowerCase()](route.path, async (req, res) => {
                try {
                    // ✅ Validate body if schema exists
                    const schema = validationMap.get(ctor)?.get(route.handlerName);
                    if (schema) {
                        const parsed = schema.safeParse(req.body);
                        if (!parsed.success) {
                            return res.status(400).json({
                                error: "Invalid request payload",
                                issues: parsed.error.format(),
                            });
                        }
                        req.body = parsed.data;
                    }

                    // ✅ Call system handler
                    const output = await handler(req, res);
                    res.json(output);
                } catch (err: any) {
                    console.error(`❌ Error in ${ctor.name}.${route.handlerName}:`, err);
                    res.status(500).json({ error: err.message });
                }
            });

            console.log(
                `🧩 HTTP route ${route.method} ${route.path} → ${ctor.name}.${route.handlerName}()`
            );
        }
    }

    listen(port = 3030) {
        const swaggerPath = swaggerUiDist.getAbsoluteFSPath();
        const router = this.app;

        // ✅ Serve Swagger UI
        router.use("/docs", express.static(swaggerPath));

        router.get("/docs/ui", (req, res) => {
            res.send(`
<!DOCTYPE html>
<html>
  <head>
    <title>Zenith API Docs</title>
    <link rel="stylesheet" type="text/css" href="/docs/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/docs/swagger-ui-bundle.js"></script>
    <script>
      async function loadDocs() {
        const res = await fetch("/docs.json");
        const spec = await res.json();
        window.ui = SwaggerUIBundle({ spec, dom_id: "#swagger-ui" });
      }

      loadDocs();

      const socket = new WebSocket("ws://" + location.host);
      socket.addEventListener("message", event => {
        if (event.data === "docs-update") {
          console.log("🔁 Swagger schema reloaded");
          loadDocs();
        }
      });
    </script>
  </body>
</html>
`);

        });


        // ✅ Serve OpenAPI spec
        router.get("/docs.json", (req, res) => {
            res.json(generateOpenAPISpec());
        });


        const server = this.app.listen(port, () => {
            console.log(`🌐 Zenith HTTP router listening on http://localhost:${port}`);
        });

        this.wss = new WebSocketServer({ server });

    }

    private broadcast(event: string, payload: any = {}) {
        const message = JSON.stringify({ event, payload });
        this.wss?.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(message);
            }
        });
    }

}
