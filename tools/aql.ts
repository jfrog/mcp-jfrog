import { z } from "zod";
import { zodToJsonSchema } from 'zod-to-json-schema';
import { jfrogRequest } from "../common/utils.js";
import * as aqlSchemas from "../schemas/aql.js";

/**
 * Execute an AQL query against the JFrog Artifactory
 * @param query The AQL query to execute
 * @param options Additional options for the query
 * @returns The search results
 */
export async function executeAQLQuery(
  query: string, 
  options: {
    transitive?: boolean;
    domain?: string;
    limit?: number;
    offset?: number;
    include_fields?: string[];
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  } = {}
): Promise<any> {
  let aqlQuery = query;
  
  // If the query doesn't already have a domain specified, add it
  if (options.domain && !aqlQuery.includes('.find(')) {
    aqlQuery = `${options.domain}.find(${aqlQuery})`;
  }
  
  // Add include fields if specified
  if (options.include_fields && options.include_fields.length > 0 && !aqlQuery.includes('.include(')) {
    const includeFields = options.include_fields.map(field => `"${field}"`).join(',');
    aqlQuery = `${aqlQuery}.include(${includeFields})`;
  }
  
  // Add sorting if specified
  if (options.sort_by && !aqlQuery.includes('.sort(')) {
    const sortOrder = options.sort_order || 'asc';
    aqlQuery = `${aqlQuery}.sort({"$${sortOrder}":["${options.sort_by}"]})`;
  }
  
  // Add limit if specified
  if (options.limit && !aqlQuery.includes('.limit(')) {
    aqlQuery = `${aqlQuery}.limit(${options.limit})`;
  }
  
  // Add offset if specified
  if (options.offset && !aqlQuery.includes('.offset(')) {
    aqlQuery = `${aqlQuery}.offset(${options.offset})`;
  }
  
  // Add transitive if specified
  if (options.transitive) {
    aqlQuery = `${aqlQuery}.transitive()`;
  }
  
  const response = await jfrogRequest("/artifactory/api/search/aql", {
    method: "POST",
    body: aqlQuery,
    headers: {
      "Content-Type": "text/plain"
    }
  });
  
  return aqlSchemas.AQLSearchResponseSchema.parse(response);
}

/* Tools Section */

const executeAQLQueryTool = {
  name: "jfrog_execute_aql_query",
  description: "Execute an Artifactory Query Language (AQL) query to search for artifacts, builds, or other entities in JFrog Artifactory. AQL is a powerful query language for searching and filtering artifacts in Artifactory repositories. It supports complex criteria, sorting, pagination, and more.",
  inputSchema: zodToJsonSchema(aqlSchemas.AQLSearchSchema)
};

/* End of Tools creation Section */

export const AQLTools = [
  executeAQLQueryTool
]; 