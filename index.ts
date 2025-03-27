#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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

// setupHandlers(server);
// Start server using stdio transport
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("JFrog MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
