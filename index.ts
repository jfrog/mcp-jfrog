#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  
} from "@modelcontextprotocol/sdk/types.js";
import {executeTool, tools as JFrogTools} from "./tools/index.js";
import { z } from "zod";
import { formatJFrogError } from "./common/utils.js";
import {
  isJFrogError,
} from "./common/errors.js";
import { VERSION } from "./common/version.js";
import express from "express";
import cors from "cors";

// Declare process type for TypeScript
declare const process: {
  env: Record<string, string | undefined>;
  exit: (code: number) => void;
  on: (event: string, listener: (...args: any[]) => void) => void;
};

// Configure logging levels
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Get log level from environment or default to INFO
const LOG_LEVEL = process.env.LOG_LEVEL ? 
  (LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel] ?? LogLevel.INFO) : 
  LogLevel.INFO;

// Logger function with timestamps and levels
function log(level: LogLevel, message: string, meta?: any) {
  if (level >= LOG_LEVEL) {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    console.error(`[${timestamp}] [${levelName}] ${message}${metaStr}`);
  }
}

// Initialize the server
const server = new Server(
  {
    name: "jfrog-mcp-server",
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register available tools
log(LogLevel.INFO, `Registering ${JFrogTools.length} tools`);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  log(LogLevel.DEBUG, "Handling ListToolsRequest");
  return {
    tools: JFrogTools
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const toolName = request.params.name;
    log(LogLevel.DEBUG, `Handling CallToolRequest for tool: ${toolName}`, { 
      arguments: request.params.arguments ? JSON.stringify(request.params.arguments).substring(0, 100) + '...' : 'none'
    });
    
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }
    
    const startTime = Date.now();
    const results = await executeTool(toolName, request.params.arguments);
    const duration = Date.now() - startTime;
    
    log(LogLevel.INFO, `Tool execution completed: ${toolName}`, { 
      duration: `${duration}ms`
    });
    
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMsg = `Invalid input: ${JSON.stringify(error.errors)}`;
      log(LogLevel.ERROR, errorMsg);
      throw new Error(errorMsg);
    }
    if (isJFrogError(error)) {
      const formattedError = formatJFrogError(error);
      log(LogLevel.ERROR, `JFrog API error`, { error: formattedError });
      throw new Error(formattedError);
    }
    
    log(LogLevel.ERROR, `Unexpected error handling request`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    throw error;
  }
});

// Check if SSE mode is enabled via environment variable
const sseEnabled = process.env.TRANSPORT === 'sse';
const port = parseInt(process.env.PORT || '8080', 10);
const maxReconnectAttempts = parseInt(process.env.MAX_RECONNECT_ATTEMPTS || '5', 10);
const reconnectDelay = parseInt(process.env.RECONNECT_DELAY_MS || '2000', 10);

// Start server using appropriate transport
async function runServer() {
  if (sseEnabled) {
    log(LogLevel.INFO, `Starting server in SSE mode on port ${port}`);
    
    // Setup Express app for SSE transport
    const app = express();
    
    // Request logging middleware
    app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        log(LogLevel.DEBUG, `${req.method} ${req.originalUrl} ${res.statusCode}`, {
          duration: `${duration}ms`,
          contentType: res.getHeader('content-type'),
          userAgent: req.headers['user-agent']
        });
      });
      
      next();
    });
    
    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      log(LogLevel.ERROR, `Express error: ${err.message}`, { 
        stack: err.stack,
        path: req.path
      });
      
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message
      });
    });
    
    // Configure CORS
    const corsOrigin = process.env.CORS_ORIGIN || '*';
    log(LogLevel.INFO, `Configuring CORS with origin: ${corsOrigin}`);
    
    app.use(cors({
      origin: corsOrigin,
      methods: 'GET, POST, OPTIONS',
      allowedHeaders: 'Content-Type, Authorization, x-api-key'
    }));
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'ok', 
        version: VERSION,
        transport: 'sse'
      });
    });
    
    // Connection info endpoint
    app.get('/connections', (req, res) => {
      const connectionsInfo = Array.from(connections.entries()).map(([id, conn]) => ({
        id,
        connectedAt: conn.connectedAt,
        age: Date.now() - conn.connectedAt.getTime(),
        userAgent: conn.res.req.headers['user-agent'] || 'unknown'
      }));
      
      res.status(200).json({
        total: connections.size,
        connections: connectionsInfo
      });
    });
    
    // SSE connection management
    let connections = new Map<string, { 
      transport: SSEServerTransport, 
      res: express.Response, 
      connectedAt: Date 
    }>();
    
    // Setup SSE endpoint
    app.get('/sse', (req, res) => {
      const connectionId = req.query.connectionId?.toString() || `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      log(LogLevel.INFO, `SSE connection established`, { 
        connectionId,
        userAgent: req.headers['user-agent'],
        remoteAddress: req.ip
      });
      
      // Create transport instance
      const transport = new SSEServerTransport('/messages', res);
      
      // Keep track of connection
      connections.set(connectionId, { 
        transport, 
        res, 
        connectedAt: new Date() 
      });
      
      // Connect server to transport
      server.connect(transport).catch(error => {
        log(LogLevel.ERROR, `Failed to connect server to transport: ${error.message}`, {
          connectionId,
          stack: error.stack
        });
      });
      
      // Clean up on client disconnect
      req.on('close', () => {
        log(LogLevel.INFO, `SSE connection closed`, { connectionId });
        
        // Clean up
        connections.delete(connectionId);
        
        // Log active connection count
        log(LogLevel.DEBUG, `Active SSE connections: ${connections.size}`);
      });
    });
    
    // Setup messages endpoint for client-to-server communication
    app.post('/messages', express.json({ limit: '1mb' }), (req, res) => {
      const connectionId = req.query.connectionId?.toString();
      
      if (!connectionId) {
        log(LogLevel.WARN, 'Message received without connectionId');
        return res.status(400).json({ 
          error: 'Missing connectionId parameter', 
          message: 'You must provide a connectionId query parameter matching your SSE connection'
        });
      }
      
      const connection = connections.get(connectionId);
      
      if (connection) {
        log(LogLevel.DEBUG, `Message received for connection: ${connectionId}`, {
          body: typeof req.body === 'object' ? JSON.stringify(req.body).substring(0, 100) : 'invalid'
        });
        
        try {
          connection.transport.handlePostMessage(req, res);
        } catch (error) {
          log(LogLevel.ERROR, `Error handling message: ${error instanceof Error ? error.message : String(error)}`, {
            connectionId,
            stack: error instanceof Error ? error.stack : undefined
          });
          
          // If headers haven't been sent yet, send an error response
          if (!res.headersSent) {
            res.status(500).json({ 
              error: 'Internal server error',
              message: error instanceof Error ? error.message : String(error) 
            });
          }
        }
      } else {
        log(LogLevel.WARN, `Message received for unknown connection: ${connectionId}`);
        res.status(404).json({ 
          error: 'Connection not found', 
          message: 'Establish an SSE connection first with the same connectionId',
          activeConnections: connections.size
        });
      }
    });
    
    // Periodically log connection statistics
    setInterval(() => {
      if (connections.size > 0) {
        log(LogLevel.INFO, `Active SSE connections: ${connections.size}`);
      }
    }, 60000); // Every minute
    
    // Handle unexpected errors
    process.on('uncaughtException', (error) => {
      log(LogLevel.ERROR, `Uncaught exception: ${error.message}`, { stack: error.stack });
    });
    
    process.on('unhandledRejection', (reason) => {
      log(LogLevel.ERROR, `Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`, {
        stack: reason instanceof Error ? reason.stack : undefined
      });
    });
    
    // Start Express server with reconnection logic
    let serverStarted = false;
    let attempts = 0;
    
    const startExpressServer = () => {
      app.listen(port, () => {
        serverStarted = true;
        log(LogLevel.INFO, `JFrog MCP Server running in SSE mode on port ${port}`);
      }).on('error', (error) => {
        log(LogLevel.ERROR, `Failed to start server: ${error.message}`);
        
        if (!serverStarted && attempts < maxReconnectAttempts) {
          attempts++;
          const delay = reconnectDelay * attempts;
          log(LogLevel.WARN, `Retrying server start in ${delay}ms (attempt ${attempts}/${maxReconnectAttempts})`);
          
          setTimeout(startExpressServer, delay);
        } else if (!serverStarted) {
          log(LogLevel.ERROR, `Failed to start server after ${attempts} attempts, giving up`);
          process.exit(1);
        }
      });
    };
    
    startExpressServer();
  } else {
    // Fallback to stdio transport
    log(LogLevel.INFO, "Starting server in stdio mode");
    
    try {
      const transport = new StdioServerTransport();
      await server.connect(transport);
      log(LogLevel.INFO, "JFrog MCP Server running on stdio");
    } catch (error) {
      log(LogLevel.ERROR, `Failed to start stdio server: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
}

runServer().catch((error) => {
  log(LogLevel.ERROR, `Fatal error in main(): ${error instanceof Error ? error.message : String(error)}`, {
    stack: error instanceof Error ? error.stack : undefined
  });
  process.exit(1);
});
