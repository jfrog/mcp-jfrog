import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { jfrogRequest } from "../common/utils.js";
import { readFileSync } from "fs";
import { 
  ListActionsResponseSchema, 
  JFrogWorkersReadinessSchema,
  ListActionsParamSchema,
  PromptToGenerateWorkerCode,
  GenerateWorkerCodeParamSchema,
  CreateWorkerParamSchema,
} from "../schemas/workers.js";
import path from "path";
import { fileURLToPath } from "url";
import { JFrogError } from "../common/errors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLATFORM_CONTEXT_DEFINITIONS = readFileSync(path.join(__dirname, "../schemas/types/PlatformContextTypeDefinition.d.ts"), { encoding: "utf8" });

/* Api Calls Section */

export async function checkWorkersReadiness() {
  const response = await jfrogRequest("/worker/api/v1/system/readiness", {
    method: "GET",
  });
     
  return JFrogWorkersReadinessSchema.parse(response);
}


export async function listActions(projectKey?: string) {
  const response = await jfrogRequest(`/worker/api/v2/actions${projectKey ? "?projectKey="+projectKey : ""}`, {
    method: "GET"
  });
    
  return ListActionsResponseSchema.parse(response);
}

export async function createWorker(workerParams: z.infer<typeof CreateWorkerParamSchema>) {
  const filterCriteria = {};

  if (workerParams.action.name === "SCHEDULED_EVENT") {
    (filterCriteria as any).schedule = {
      cron: workerParams.settings?.cronExpression || "",
      timezone: workerParams.settings?.timezone || "UTC",
    };
  } else if (workerParams.action.name !== "GENERIC_EVENT") {
    (filterCriteria as any).artifactFilterCriteria = {
      repoKeys: workerParams.settings?.repositories || [],
      includePatterns: workerParams.settings?.includePatterns || [],
      excludePatterns: workerParams.settings?.excludePatterns || [],
      anyLocal: workerParams.settings?.anyLocal || false,
      anyRemote: workerParams.settings?.anyRemote || false,
      anyFederated: workerParams.settings?.anyFederated || false,
    };
  }

  return await jfrogRequest("/worker/api/v2/workers", {
    method: "POST",
    body: {
      enabled: false, // The AI agent should not be able to enable the worker, it should be done by the user for responsability reasons
      key: workerParams.name,
      action: workerParams.action,
      sourceCode: workerParams.workerCode,
      filterCriteria,
      secrets: [],
      properties: [],
      description: workerParams.settings?.description || "",
      shared: workerParams.settings?.allowOtherUsersToExecuteTheWorker || false,
      debug: workerParams.settings?.showStatusOfSuccessfulExecutions || false,
      projectKey: workerParams.projectKey || "",
    }
  });
}

export async function getMinimalWorkerCodeTemplate(payloadType: string, responseType: string) {
  return `
  export default async (context: PlatformContext, data: ${payloadType}): Promise<${responseType}> => {
    // __WORKER_IMPLEMENTATION__
  }
  `;
}

export async function getIntructionsForWorkerCodeGeneration(action: string, purpose: string) {
  const actions = await listActions();
  const actionToUse = actions.find((a) => a.action.name === action);

  if (!actionToUse) {
    console.warn(`No action defined in Worker service: '${action}'`);
    throw new Error(`The action '${action}' does not exist`);
  }

  // Trying to guess the responseType, otherwise use any as fallback
  let responseType = actionToUse.executionRequestType.replace("Request", "Response");
  if (!actionToUse.typesDefinitions.includes(responseType)) {
    console.warn(`The type '${responseType}' does not seem to be defined in the typesDefinition, will use any instead`);
    responseType = "any";
  }

  // Enhanced instructions with best practices
  const enhancedInstructions = `IMPORTANT: Follow these best practices when implementing the Worker:

1. **PRIORITY: Use Repository Filters** - If the action supports FILTER_REPO (filterType: "FILTER_REPO"), ALWAYS configure the repositories list in the Worker settings instead of checking repository types in the code. This is more efficient and maintainable.

2. **Repository Type Checking** - Only implement repository type checking in the Worker code if the action does NOT support FILTER_REPO or if you need dynamic filtering logic.

3. **Performance Optimization** - Avoid unnecessary API calls. If you can filter by repository in settings, do it there rather than in the code.

4. **Error Handling** - Always implement proper error handling with try-catch blocks and appropriate status responses.

5. **Logging** - Include meaningful console.log statements for monitoring and debugging.

Replace // __WORKER_IMPLEMENTATION__ according to the typeDefinitions, platformContextDefinitions and with the following logic: ${purpose}`;

  return {
    codeTemplate: await getMinimalWorkerCodeTemplate(actionToUse.executionRequestType, responseType),
    typesDefinitions: actionToUse.typesDefinitions,
    platformContextDefinitions: PLATFORM_CONTEXT_DEFINITIONS,
    instructions: enhancedInstructions
  } as z.infer<typeof PromptToGenerateWorkerCode>;
}

/* End of Api Calls Section */


/* Tools Section */
  
const checkJfrogWorkersAvailabilityTool = {
  name: "jfrog_workers_check_availability",
  description: "Check if JFrog Worker Servcie is ready and functioning or not",
  inputSchema: zodToJsonSchema(z.object({})),
  //outputSchema: zodToJsonSchema(JFrogWorkersReadinessSchema),
  handler: async () => {
    return await checkWorkersReadiness();
  }
};

const listWorkersActionsTool = {
  name: "jfrog_list_workers_actions",
  description: "List all available actions for JFrog Workers for optional project",
  inputSchema: zodToJsonSchema(ListActionsParamSchema),
  //outputSchema: zodToJsonSchema(ListActionsResponseSchema),
  handler: async (args: any) => {
    const parsedArgs = ListActionsParamSchema.parse(args);
    try {
      return await listActions(parsedArgs.projectKey);
    } catch(error) {
      if (error instanceof JFrogError) {
        return {
          error: error.message,
          status: error.status,
          response: error.response
        };
      } else {
        return "An error occurred while listing the workers actions: " + (error as Error).message;
      }
    }
  }
};

const generateWorkerCodeTool = {
  name: "jfrog_generate_worker_code",
  description: "Generate a worker script for a specified action and settings, based on a provided description of its intended purpose",
  inputSchema: zodToJsonSchema(GenerateWorkerCodeParamSchema),
  //outputSchema: zodToJsonSchema(PromptToGenerateWorkerCode),
  handler: async (args: any) => {
    const parsedArgs = GenerateWorkerCodeParamSchema.parse(args);
    return await getIntructionsForWorkerCodeGeneration(parsedArgs.action, parsedArgs.intendedPurpose);
  }
};

const createWorkerTool = {
  name: "jfrog_create_worker",
  description: "Create a new worker based on a provided description of its intended purpose",
  inputSchema: zodToJsonSchema(CreateWorkerParamSchema),
  //outputSchema: zodToJsonSchema(CreateWorkerResponseSchema),
  handler: async (args: any) => {
    const parsedArgs = CreateWorkerParamSchema.parse(args);
    try {
      return await createWorker(parsedArgs);
    } catch(error) {
      if (error instanceof JFrogError) {
        return {
          error: error.message,
          status: error.status,
          response: error.response
        };
      } else {
        return "An error occurred while creating the worker: " + (error as Error).message;
      }
    }
  }
};

const getWorkerBestPracticesTool = {
  name: "jfrog_get_worker_best_practices",
  description: "Get best practices and recommendations for creating efficient JFrog Workers",
  inputSchema: zodToJsonSchema(z.object({
    action: z.string().optional().describe("Optional action name to get specific recommendations")
  })),
  handler: async (args: any) => {
    const action = args.action;
    let specificAdvice = "";
    
    if (action) {
      try {
        const actions = await listActions();
        const actionToUse = actions.find((a) => a.action.name === action);
        if (actionToUse) {
          if (actionToUse.filterType === "FILTER_REPO") {
            specificAdvice = `\n\nSPECIFIC ADVICE FOR ACTION "${action}":\n- This action supports FILTER_REPO, so ALWAYS use the repositories list in Worker settings\n- Avoid checking repository types in your Worker code\n- Configure repositories: ["repo1", "repo2"] in settings for better performance`;
          } else {
            specificAdvice = `\n\nSPECIFIC ADVICE FOR ACTION "${action}":\n- This action does NOT support FILTER_REPO\n- You may need to implement repository filtering in your Worker code if required`;
          }
        }
      } catch (error) {
        specificAdvice = `\n\nCould not get specific advice for action "${action}": ${error}`;
      }
    }

    return {
      bestPractices: [
        "🚀 PERFORMANCE: Use repository filters in settings instead of code checking when possible",
        "🔧 MAINTENANCE: Configure repositories list in Worker settings for easy updates",
        "⚡ EFFICIENCY: Avoid unnecessary API calls in Worker code",
        "🛡️ RELIABILITY: Always implement proper error handling with try-catch",
        "📊 MONITORING: Include meaningful console.log statements",
        "🎯 FOCUS: Keep Worker code focused on business logic, not infrastructure concerns"
      ],
      recommendations: [
        "For FILTER_REPO actions: Use settings.repositories = ['repo1', 'repo2']",
        "For non-FILTER_REPO actions: Implement filtering logic in code if needed",
        "Always check action.filterType before deciding on filtering approach",
        "Use includePatterns/excludePatterns for path-based filtering",
        "Test Workers on development repositories first"
      ],
      specificAdvice: specificAdvice
    };
  }
};

export const WorkersTools = [ 
  checkJfrogWorkersAvailabilityTool,
  listWorkersActionsTool,
  generateWorkerCodeTool,
  createWorkerTool,
  getWorkerBestPracticesTool,
];
 
/* End of Tools creation Section */