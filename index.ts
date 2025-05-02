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


server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: JFrogTools
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }
    const results = await executeTool(request.params.name, request.params.arguments);
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };

    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
    }
    if (isJFrogError(error)) {
      throw new Error(formatJFrogError(error));
    }
    throw error;
  }
});

// Check if SSE mode is enabled via environment variable
const sseEnabled = process.env.TRANSPORT === 'sse';
const port = parseInt(process.env.PORT || '8080', 10);

// Start server using appropriate transport
async function runServer() {
  if (sseEnabled) {
    // Setup Express app for SSE transport
    const app = express();
    
    // Configure CORS
    app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: 'GET, POST, OPTIONS',
      allowedHeaders: 'Content-Type, Authorization, x-api-key'
    }));
    
    let transport: SSEServerTransport | null = null;
    
    // Setup SSE endpoint
    app.get('/sse', (req, res) => {
      console.error('SSE connection established');
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      transport = new SSEServerTransport('/messages', res);
      server.connect(transport);
      
      // Handle client disconnect
      req.on('close', () => {
        console.error('SSE connection closed');
      });
    });
    
    // Setup messages endpoint for client-to-server communication
    app.post('/messages', express.json(), (req, res) => {
      if (transport) {
        transport.handlePostMessage(req, res);
      } else {
        res.status(503).json({ error: 'SSE connection not established' });
      }
    });
    
    // Start Express server
    app.listen(port, () => {
      console.error(`JFrog MCP Server running in SSE mode on port ${port}`);
    });
  } else {
    // Fallback to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("JFrog MCP Server running on stdio");
  }
}

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
