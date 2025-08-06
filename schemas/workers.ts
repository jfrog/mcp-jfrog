/* Schema Section */
import { z } from "zod";

export const ActionFilterTypeEnum = z.enum(["NO_FILTERS", "FILTER_REPO", "SCHEDULE"]);

export const JFrogWorkersReadinessSchema= z.object({
  code: z.string()
});

export const ListActionsParamSchema = z.object({
  projectKey: z.string().optional().describe("The project key for which you want to retrieve available actions. If not provided, all actions will be retrieved. Note: without a projectKey, the token must have full admin rights; with a projectKey, project admin rights or higher are sufficient")
});

export const ListWorkersParamSchema = z.object({
  projectKey: z.string().optional().describe("The project key for which you want to retrieve available workers. If not provided, all workers will be retrieved. Note: without a projectKey, the token must have full admin rights; with a projectKey, project admin rights or higher are sufficient")
});

export const ListWorkersResponseSchema = z.object({
  workers: z.array(
    z.object({
      key: z.string().describe("The name of the worker"),
      application: z.string().describe("The application that triggers workers that belong to this action"),
      description: z.string().optional().describe("Describes what this worker does"),
      enabled: z.boolean().describe("Whether the worker is enabled. If true,the Worker can be triggered by the action"),
      sourceCode: z.string().describe("The source code of the worker"),
      action: z.string().describe("The action that triggers this worker"),
      filterCriteria: z.union(
        [
          z.object({
            artifactFilterCriteria: z.object({
              repoKeys: z.array(z.string()).optional().default([]).describe("The list of repositories that will trigger this Worker when the specified action occurs. Only for Workers hooked to an action with a filterType="+ActionFilterTypeEnum.Values.FILTER_REPO),
              includePatterns: z.array(z.string()).optional().default([]).describe("Patterns that trigger the Worker when they match an artifact path. Supports simple wildcard patterns for repository artifact paths (without a leading slash) using Ant-style expressions (*, **, ?). Example: org/apache/**. Only for Workers hooked to an action with a filterType="+ActionFilterTypeEnum.Values.FILTER_REPO),
              excludePatterns: z.array(z.string()).optional().default([]).describe("Patterns that prevent the Worker from being triggered when they match an artifact path. These take precedence over include patterns and support simple wildcard matching for repository artifact paths (without a leading slash) using Ant-style expressions (*, **, ?). Example: org/apache/**. Only for Workers hooked to an action with a filterType="+ActionFilterTypeEnum.Values.FILTER_REPO),
              anyLocal: z.boolean().optional().default(false).describe("When true, the Worker will trigger when any local repository is affected. Only for Workers hooked to an action with a filterType="+ActionFilterTypeEnum.Values.FILTER_REPO),
              anyRemote: z.boolean().optional().default(false).describe("When true, the Worker will trigger when any remote repository is affected. Only for Workers hooked to an action with a filterType="+ActionFilterTypeEnum.Values.FILTER_REPO),
              anyFederated: z.boolean().optional().default(false).describe("When true, the Worker will trigger when any federated repository is affected. Only for Workers hooked to an action with a filterType="+ActionFilterTypeEnum.Values.FILTER_REPO)
            }),
          }).optional().describe("The filter criteria that will trigger this Worker based on a repository. Only for Worker with filterType="+ActionFilterTypeEnum.Values.FILTER_REPO),
          z.object({
            scheduleFilterCriteria: z.object({
              cronExpression: z.string().describe("The cron expression specifying when this Worker should be triggered. Only for Worker of type SCHEDULE"),
              timezone: z.string().describe("String representation of the timezone in which the Worker is scheduled to run. Must be compatible with Date from the JS API. Only for Worker of type SCHEDULE")
            })
          }).optional().describe("The filter criteria that will trigger this Worker based on a schedule. Only for Worker with filterType="+ActionFilterTypeEnum.Values.SCHEDULE),
          z.object({}).describe("No filter criteria for Worker with filterType="+ActionFilterTypeEnum.Values.NO_FILTERS),
          z.undefined().describe("No filter criteria for Worker with filterType="+ActionFilterTypeEnum.Values.NO_FILTERS),
        ]
      ).optional().describe("The filter criteria that will trigger this Worker when the specified action occurs"),
      secrets: z.array(z.object({
        key: z.string().describe("The name of the secret"),
        value: z.string().optional().describe("The value of the secret")
      }).optional()).optional().describe("The list of the secrets stored along side of the Worker"),
      properties: z.array(z.object({
        key: z.string().describe("The name of the property"),
        value: z.string().optional().describe("The value of the property"),
      }).optional()).optional().describe("The list of properties stored along side of the Worker"),
      shared: z.boolean().optional().describe("Whether the Worker can be triggered by non admin users"),
      debug: z.boolean().optional().describe("Whether the execution result of this Worker should be recorded when the execution is successful"),
      projectKey: z.string().optional().describe("The project key in which the Worker belongs to"),
      currentVersion: z.object({
        modifiedAt: z.number().describe("The timestamp of the last modification of the Worker"),
        modifiedBy: z.string().describe("The user who last modified the Worker"),
      }).optional().describe("The current version of the Worker"),
    })
  ),
});

export const WorkerSettingsType = z.object({
  description: z.string().optional().describe("Describes what this worker does"),
  repositories: z.array(z.string()).optional().describe("CRITICAL FOR PERFORMANCE: The list of repositories that will trigger this Worker when the specified action occurs. Use this instead of checking repository types in code for better performance. Only for Workers hooked to an action with a filterType="+ActionFilterTypeEnum.Values.FILTER_REPO),
  includePatterns: z.array(z.string()).optional().describe("Patterns that trigger the Worker when they match an artifact path. Supports simple wildcard patterns for repository artifact paths (without a leading slash) using Ant-style expressions (*, **, ?). Example: org/apache/**. Only for Workers hooked to an action with a filterType="+ActionFilterTypeEnum.Values.FILTER_REPO),
  excludePatterns: z.array(z.string()).optional().describe("Patterns that prevent the Worker from being triggered when they match an artifact path. These take precedence over include patterns and support simple wildcard matching for repository artifact paths (without a leading slash) using Ant-style expressions (*, **, ?). Example: org/apache/**. Only for Workers hooked to an action with a filterType="+ActionFilterTypeEnum.Values.FILTER_REPO),
  anyLocal: z.boolean().optional().default(false).describe("Whether the Worker should trigger when any local repository is affected. Only for Workers hooked to an action with a filterType="+ActionFilterTypeEnum.Values.FILTER_REPO),
  anyRemote: z.boolean().optional().default(false).describe("Whether the Worker should trigger when any remote repository is affected. Only for Workers hooked to an action with a filterType="+ActionFilterTypeEnum.Values.FILTER_REPO),
  anyFederated: z.boolean().optional().default(false).describe("Whether the Worker should trigger when any federated repository is affected. Only for Workers hooked to an action with a filterType="+ActionFilterTypeEnum.Values.FILTER_REPO),
  cronExpression: z.string().optional().describe("The cron expression specifying when this Worker should be triggered. Only for Worker of type SCHEDULE Only for Workers hooked to an action with a filterType="+ActionFilterTypeEnum.Values.SCHEDULE),
  timezone: z.string().optional().describe("String representation of the timezone in which the Worker is scheduled to run. Must be compatible with Date from the JS API. Only for Worker of type SCHEDULE"),
  secrets: z.array(z.object({
    name: z.string().describe("The name of the secret"),
    value: z.string().describe("The value of the secret"),
  })).optional().default([]).describe("The list of secrets that will be used by the Worker. These secrets are cyphered and may be used in the Worker code with context.secrets.get(secretName)"),
  properties: z.array(z.object({
    name: z.string().describe("The name of the property"),
    value: z.string().describe("The value of the property"),
  })).optional().default([]).describe("The list of properties that will be used by the Worker. These properties are not cyphered and may be used in the Worker code with context.properties.get(propertyName)"),
  showStatusOfSuccessfulExecutions: z.boolean().optional().default(false).describe("Indicates whether the execution result of this Worker should be recorded when the execution is successful"),
  allowOtherUsersToExecuteTheWorker: z.boolean().optional().default(false).describe("Allow non admin users to trigger this Worker. Only for HTTP-Trigerred workers"),
});

export const CreateWorkerParamSchema = z.object({
  projectKey: z.string().optional().describe("The project context in which the Worker should belong to"),
  name: z.string().describe("The name of the Worker. It must start with a letter, may include dashes, and must be between 2 and 40 characters in length. Special characters other than dashes are not allowed"),
  action: z.object({
    name: z.string().describe("The name of the action"),
    application: z.string().describe("The application that triggers workers that belong to this action"),
  }).describe("The action on which the Worker belongs to. These informations are retrieved from the MCP command jfrog_list_workers_actions"),
  workerCode: z.string().describe("The TS/JS code of the Worker"),
  settings: WorkerSettingsType.optional().describe("Define settings regarding a Worker"),
});

export const CreateWorkerResponseSchema = z.object({
  success: z.boolean().describe("Whether the worker was created successfully"),
  message: z.string().describe("The message to display to the user when the worker is created"),
  data: z.any().describe("The response of the HTTP call"),
  workerKey: z.string().describe("The name of the created Worker"),
  editUrl: z.string().describe("The URL to edit the worker"),
  disclaimer: z.string().describe("Critical information to display to the user when the worker is created"),
});

export const GenerateWorkerCodeParamSchema = z.object({
  intendedPurpose: z.string().describe("The intended purpose of the Worker"),
  action: z.string().describe("This is the action name defined in the ListActionsResponseSchema"),
});

export const ListActionsResponseSchema = z.array(
  z.object({
    action: z.object({
      name: z.string().describe("The name of the action"),
      application: z.string().describe("The application that triggers workers that belong to this action"),
    }),
    description: z.string().describe("A short description of the action. 600 characters max"),
    samplePayload: z.string().describe("Payload to put on the test panel"),
    sampleCode: z.string().describe("Code added to editor when we create a new worker, should show input/output, very basic code"),
    typesDefinitions: z.string().optional().default("").describe("A compilable javascript code defining types and interfaces used for autocompletion when editing the worker"),
    supportProject: z.boolean().optional().default(false).describe("Whether the worker should refuse to run if the filter is not set"),
    wikiUrl: z.string().describe("Link to the documentation of the worker of that action"),
    async: z.boolean().optional().default(false).describe("Whether the Worker is async (executed in background of the action)"),
    filterType: ActionFilterTypeEnum.optional().describe("Kind of filters supported by the action"),
    executionRequestType: z.string().optional().default("any").describe("The type of the input payload (data) to be sent. It must be defined in the typesDefinition"),
  }));

export const PromptToGenerateWorkerCode = z.object({
  codeTemplate: z.string().describe("The template to use for the code generation"),
  typesDefinitions: z.string().describe("A compilable javascript code defining types and interfaces used for autocompletion when editing the worker"),
  platformContextDefinitions: z.string().describe("Defines the interfaces for the internal APIs used by Workers"),
  instructions: z.string().describe("IMPORTANT: These are the instructions that the AI agent must follow in order to replace the placeholders in the template")
});

/* End of Schema Section */