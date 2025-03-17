import { z } from "zod";

export const GetSpecificBuildSchema = z.object({
    buildName: z.string().describe("Name of the build to retrieve"),
    project: z.string().optional().describe("Optional project key to scope the build search")
  });

  export const JFrogBuildDetailsSchema = z.object({
    uri: z.string(),
    buildsNumbers: z.array(z.object({
      uri: z.string(),
      started: z.string().describe("Build start timestamp in ISO8601 format")
    }))
  });

  export const JFrogBuildsListSchema = z.object({
    uri: z.string(),
    builds: z.array(z.object({ uri: z.string(), lastStarted: z.string() }))
  });
  