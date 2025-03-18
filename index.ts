#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  
} from "@modelcontextprotocol/sdk/types.js";
import {tools as JFrogTools} from './tools/index.js'
import { z } from 'zod';
import * as repository from './tools/repositories.js';
import * as builds from './tools/builds.js'
import * as runtime from './tools/runtime.js'
import * as access from './tools/access.js'
import * as release_lifecycle from './tools/release_lifecycle.js'
import * as mission_control from './tools/mission_control.js'
import * as aql from './tools/aql.js'

import * as repositorySchemas from './schemas/repositories.js';
import * as runtimeSchemas from './schemas/runtime.js';
import * as accessSchemas from './schemas/access.js';
import * as buildsSchemas from './schemas/builds.js';
import * as release_lifecycleSchemas from './schemas/release_lifecycle.js';
import * as aqlSchemas from './schemas/aql.js';
import { formatJFrogError } from './common/utils.js';
import {
  isJFrogError,
} from './common/errors.js';
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

    switch (request.params.name) {

      case "jfrog_check_availability": {
        //const args = repository.SearchRepositoriesSchema.parse(request.params.arguments);
        const results = await repository.checkPlatformReadiness();
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "jfrog_list_runtime_clusters": {   
        const args = runtimeSchemas.getAllRuntimeClustersSchema.parse({
          ...request.params.arguments,
          limit: request.params.arguments.limit ? parseInt(request.params.arguments.limit.toString()) : 50
        });
        const results = await runtime.getAllRuntimeClusters(args.limit);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "jfrog_list_running_images": {
        const args = runtimeSchemas.ListRunningImagesSchema.parse(request.params.arguments);
        const results = await runtime.getRunningImages(args);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "jfrog_list_repositories": {
        const args = repositorySchemas.ListRepositoriesParamsSchema.parse(request.params.arguments);
        const results = await repository.listRepositories(args);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "jfrog_get_runtime_specific_cluster": {
        const args = runtimeSchemas.getRuntimeClusterSchema.parse(request.params.arguments);
        const results = await runtime.getRuntimeCluster(Number(args.clusterId));
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "jfrog_create_local_repository": {
        const args = repositorySchemas.CreateLocalRepoSchema.parse(request.params.arguments);
        const results = await repository.createLocalRepository(args);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "jfrog_create_remote_repository": {
        const args = repositorySchemas.CreateRemoteRepoSchema.parse(request.params.arguments);
        const results = await repository.createRemoteRepository(args);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "jfrog_create_virtual_repository": {
        const args = repositorySchemas.CreateVirtualRepoSchema.parse(request.params.arguments);
        const results = await repository.createVirtualRepository(args);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "jfrog_create_release_bundle": {
        const args = release_lifecycleSchemas.CreateReleaseBundleSchema.parse(request.params.arguments);
        const results = await release_lifecycle.createReleaseBundle(args);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "jfrog_promote_release_bundle": {
        const args = release_lifecycleSchemas.PromoteReleaseBundleSchema.parse(request.params.arguments);
        const results = await release_lifecycle.promoteReleaseBundle(args);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "jfrog_distribute_release_bundle": {
        const args = release_lifecycleSchemas.DistributeReleaseBundleSchema.parse(request.params.arguments);
        const results = await release_lifecycle.distributeReleaseBundle(args);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "jfrog_list_builds": {
        //const args = repository.SearchRepositoriesSchema.parse(request.params.arguments);
        const results = await builds.getAllBuilds();
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "jfrog_get_specific_build": {
        const args = buildsSchemas.GetSpecificBuildSchema.parse(request.params.arguments);
        const results = await builds.getSpecificBuild(args.buildName, args.project);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "jfrog_list_environments": {
        const results = await access.getAllEnvironments();
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
        }

      case "jfrog_list_projects": {
        const results = await access.getAllProjects();
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "jfrog_get_specific_project": {
        const args = z.object({ project_key: z.string() }).parse(request.params.arguments);
        const results = await access.getSpecificProjectInformation(args.project_key);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "jfrog_create_project": {
        const args = accessSchemas.CreateProjectSchema.parse(request.params.arguments);
        const results = await access.createProject(args);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "jfrog_list_associated_instances": {
        const results = await mission_control.getAllJPDInstances();
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
        }

      case "jfrog_set_folder_property": {
        const args = repositorySchemas.SetFolderPropertySchema.parse(request.params.arguments);
        const results = await repository.setFolderProperty(args.folderPath, args.properties, args.recursive);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "jfrog_execute_aql_query": {
        const args = aqlSchemas.AQLSearchSchema.parse(request.params.arguments);
        const results = await aql.executeAQLQuery(args.query, {
          transitive: args.transitive,
          domain: args.domain,
          limit: args.limit,
          offset: args.offset,
          include_fields: args.include_fields,
          sort_by: args.sort_by,
          sort_order: args.sort_order
        });
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
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
