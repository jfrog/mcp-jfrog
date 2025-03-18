import { z } from "zod";

// Schema for AQL search parameters
export const AQLSearchSchema = z.object({
  query: z.string().describe("The AQL query to execute. Must follow AQL syntax (e.g., items.find({\"repo\":\"my-repo\"}).include(\"name\",\"path\"))"),
  transitive: z.boolean().optional().default(false).describe("Whether to search in remote repositories"),
  domain: z.enum(["items", "builds", "archive.entries", "build.promotions", "releases"]).optional()
    .describe("The primary domain to search in. If not specified, it will be extracted from the query."),
  limit: z.number().default(50).describe("Maximum number of results to return"),
  offset: z.number().optional().describe("Number of results to skip"),
  include_fields: z.array(z.string()).optional().describe("Fields to include in the results"),
  sort_by: z.string().optional().describe("Field to sort results by"),
  sort_order: z.enum(["asc", "desc"]).optional().default("asc").describe("Sort order")
});

// Schema for AQL search response
export const AQLSearchResponseSchema = z.object({
  results: z.array(z.any()).describe("The search results"),
  range: z.object({
    start_pos: z.number().describe("The starting position of the results"),
    end_pos: z.number().describe("The ending position of the results"),
    total: z.number().describe("The total number of results"),
    limit: z.number().optional().describe("The maximum number of results that can be returned")
  }),
  notification: z.string().optional().describe("Notification message if results are trimmed")
}); 