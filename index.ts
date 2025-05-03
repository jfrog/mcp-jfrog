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
  uptime: () => number;
};

// Add NodeJS.Timeout declaration
declare namespace NodeJS {
  interface Timeout {}
}

// Extend the SSEServerTransport interface to add messageCount property
interface ExtendedSSEServerTransport extends SSEServerTransport {
  messageCount?: number;
}

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
        userAgent: conn.res.req.headers['user-agent'] || 'unknown',
        isCursorClient: conn.isCursorClient,
        remoteAddress: conn.res.req.ip || conn.res.req.connection?.remoteAddress || 'unknown',
        messagesSent: conn.transport.messageCount || 0,
        lastActivity: conn.lastActivity || conn.connectedAt,
        hasKeepAlive: !!conn.keepAliveInterval
      }));
      
      res.status(200).json({
        total: connections.size,
        connections: connectionsInfo,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });
    
    // SSE connection management
    let connections = new Map<string, { 
      transport: ExtendedSSEServerTransport, 
      res: express.Response, 
      connectedAt: Date,
      isCursorClient: boolean,
      lastActivity: Date,
      keepAliveInterval: NodeJS.Timeout
    }>();
    
    // Setup SSE endpoint
    app.get('/sse', (req, res) => {
      // Extract connectionId from query params, cookies, or generate a new one
      const connectionIdFromQuery = req.query.connectionId?.toString();
      const connectionIdFromCookie = req.headers.cookie?.split(';')
        .map(cookie => cookie.trim())
        .find(cookie => cookie.startsWith('connectionId='))
        ?.split('=')[1];
      
      const connectionId = connectionIdFromQuery || connectionIdFromCookie || `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Set a cookie for clients that don't provide connectionId
      if (!connectionIdFromQuery && !connectionIdFromCookie) {
        res.setHeader('Set-Cookie', `connectionId=${connectionId}; Path=/; SameSite=Strict`);
      }
      
      // Detect if this is a Cursor MCP client
      const userAgent = req.headers['user-agent'] || '';
      const isCursorClient = userAgent.includes('Cursor') || userAgent.includes('VSCode');
      
      // Set proper headers for SSE (in case SDK transport doesn't set them)
      res.setHeader('X-Accel-Buffering', 'no'); // Important for nginx proxies
      
      log(LogLevel.INFO, `SSE connection established`, { 
        connectionId,
        userAgent: req.headers['user-agent'],
        remoteAddress: req.ip,
        fromQuery: !!connectionIdFromQuery,
        fromCookie: !!connectionIdFromCookie,
        isCursorClient
      });
      
      // Create transport instance
      const transport = new SSEServerTransport('/messages', res) as ExtendedSSEServerTransport;
      transport.messageCount = 0;
      
      // Send a comment to keep the connection alive
      const keepAliveInterval = setInterval(() => {
        try {
          res.write(`:keepalive ${new Date().toISOString()}\n\n`);
        } catch (err) {
          // If we can't write to the response, the connection is probably closed
          clearInterval(keepAliveInterval);
          // Remove from connections if it still exists
          if (connections.has(connectionId)) {
            log(LogLevel.INFO, `Connection closed during keepalive`, { connectionId });
            connections.delete(connectionId);
          }
        }
      }, 30000); // Send keepalive every 30 seconds
      
      // Keep track of connection with client info
      connections.set(connectionId, { 
        transport, 
        res, 
        connectedAt: new Date(),
        isCursorClient,
        lastActivity: new Date(),
        keepAliveInterval
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
        
        // Clear the keepalive interval
        clearInterval(keepAliveInterval);
        
        // Clean up
        connections.delete(connectionId);
        
        // Log active connection count
        log(LogLevel.DEBUG, `Active SSE connections: ${connections.size}`);
      });
    });
    
    // Setup messages endpoint for client-to-server communication
    app.post('/messages', express.json({ limit: '1mb' }), (req, res) => {
      // Try to get connectionId from query params first, then from cookies
      let connectionId = req.query.connectionId?.toString();
      
      // If not in query, try to get it from cookies
      if (!connectionId) {
        connectionId = req.headers.cookie?.split(';')
          .map(cookie => cookie.trim())
          .find(cookie => cookie.startsWith('connectionId='))
          ?.split('=')[1];
      }
      
      // Special mode for Cursor: if there's only one active connection, use that regardless of connectionId
      const allConnections = Array.from(connections.entries());
      const singleConnection = allConnections.length === 1 ? allConnections[0][1] : null;
      
      // Debug the connection state
      log(LogLevel.DEBUG, `Processing message request`, { 
        hasConnectionId: !!connectionId,
        connectionCount: connections.size,
        hasSingleConnection: !!singleConnection,
        userAgent: req.headers['user-agent']
      });
      
      if (!connectionId && singleConnection) {
        // Use the single available connection
        connectionId = allConnections[0][0]; // Use the ID of the single connection
        log(LogLevel.INFO, `No connectionId provided, but only one active connection exists - using it`, { connectionId });
      }
      
      if (!connectionId) {
        log(LogLevel.WARN, 'Message received without connectionId', {
          headers: JSON.stringify(req.headers),
          cookies: req.headers.cookie,
          activeConnections: connections.size
        });
        return res.status(400).json({ 
          error: 'Missing connectionId parameter', 
          message: 'You must provide a connectionId query parameter or cookie matching your SSE connection',
          activeConnections: connections.size,
          tip: 'If using Cursor, try restarting the client or refreshing the connection'
        });
      }
      
      const connection = connections.get(connectionId);
      
      if (connection) {
        log(LogLevel.DEBUG, `Message received for connection: ${connectionId}`, {
          body: typeof req.body === 'object' ? JSON.stringify(req.body).substring(0, 100) : 'invalid'
        });
        
        // Update last activity time
        connection.lastActivity = new Date();
        
        try {
          // Clone the request body to avoid issues with stream handling
          const requestBody = JSON.parse(JSON.stringify(req.body));
          
          // Direct forwarding of the request to avoid any potential stream handling issues
          const transport = connection.transport;
          
          if (typeof requestBody.jsonrpc === 'string') {
            // Use a more direct approach to handle the message
            if (typeof transport.onmessage === 'function') {
              // Forward the JSON-RPC message directly to the transport's message handler
              const requestId = requestBody.id;
              transport.onmessage({ 
                jsonrpc: requestBody.jsonrpc,
                id: requestId,
                method: requestBody.method,
                params: requestBody.params
              });
              
              // Send a default success response
              res.status(200).json({
                jsonrpc: "2.0",
                id: requestId,
                result: {} // Empty result to acknowledge receipt
              });
            } else {
              // Fallback to using handlePostMessage if onmessage isn't available
              connection.transport.handlePostMessage(req, res);
            }
          } else {
            // If it's not a JSON-RPC message, use the standard handler
            connection.transport.handlePostMessage(req, res);
          }
          
          // Increment message count if property exists
          if (typeof connection.transport.messageCount === 'number') {
            connection.transport.messageCount++;
          } else {
            connection.transport.messageCount = 1;
          }
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
    
    // Special endpoint for Cursor MCP client (compatible with url-based configuration)
    app.post('/', express.json({ limit: '1mb' }), (req, res) => {
      // Find the most recent connection, if any exist
      let mostRecentConnection: { id: string; connection: any } | null = null;
      
      for (const [id, conn] of connections.entries()) {
        if (!mostRecentConnection || conn.connectedAt > mostRecentConnection.connection.connectedAt) {
          mostRecentConnection = { id, connection: conn };
        }
      }
      
      log(LogLevel.DEBUG, `Root POST request received`, {
        hasConnection: !!mostRecentConnection,
        connectionCount: connections.size,
        userAgent: req.headers['user-agent'],
        body: typeof req.body === 'object' ? JSON.stringify(req.body).substring(0, 100) : 'invalid'
      });
      
      if (mostRecentConnection) {
        log(LogLevel.INFO, `Using most recent connection for root POST request`, { 
          connectionId: mostRecentConnection.id,
          connectedAt: mostRecentConnection.connection.connectedAt
        });
        
        try {
          // Update last activity time
          mostRecentConnection.connection.lastActivity = new Date();
          
          // IMPORTANT: Clone the request body to avoid issues with stream handling
          const requestBody = JSON.parse(JSON.stringify(req.body));
          
          // Direct forwarding of the request to avoid any potential stream handling issues
          const transport = mostRecentConnection.connection.transport;
          
          if (typeof requestBody.jsonrpc !== 'string') {
            throw new Error('Invalid JSON-RPC request');
          }
          
          // Use a more direct approach to handle the message
          if (typeof transport.onmessage === 'function') {
            // Forward the JSON-RPC message directly to the transport's message handler
            const requestId = requestBody.id;
            transport.onmessage({ 
              jsonrpc: requestBody.jsonrpc,
              id: requestId,
              method: requestBody.method,
              params: requestBody.params
            });
            
            // Send a default success response
            res.status(200).json({
              jsonrpc: "2.0",
              id: requestId,
              result: {} // Empty result to acknowledge receipt
            });
          } else {
            // Fallback to using handlePostMessage if onmessage isn't available
            transport.handlePostMessage(req, res);
          }
          
          // Increment message count
          if (typeof mostRecentConnection.connection.transport.messageCount === 'number') {
            mostRecentConnection.connection.transport.messageCount++;
          } else {
            mostRecentConnection.connection.transport.messageCount = 1;
          }
        } catch (error) {
          log(LogLevel.ERROR, `Error handling root POST message: ${error instanceof Error ? error.message : String(error)}`, {
            connectionId: mostRecentConnection.id,
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
        log(LogLevel.WARN, 'Root POST request received, but no active connections exist');
        res.status(503).json({
          error: 'No active connections',
          message: 'No active SSE connections found. Establish an SSE connection first.'
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
