import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { jfrogRequest } from "../common/utils.js";
import { 
    JFrogCatalogPackageSchema, 
    JFrogCatalogPackageVersionSchema, 
    JFrogCatalogPackageVersionResponseSchema,
    JFrogCatalogGraphQLResponseSchema,
    JFrogCatalogVulnerabilityResponseSchema,
    JFrogCatalogPackageVersionVulnerabilitiesSchema,
    JFrogCatalogVulnerabilityQuerySchema
} from "../schemas/catalog.js";

export async function getPackageInfo(options: { 
    type: string; 
    name: string; 
    version?: string;
}) {
    const packageVersion = !options.version || options.version.trim().toLowerCase() === 'latest' 
        ? 'latest' 
        : options.version;

    const isLatestVersion = packageVersion === 'latest';

    const query = `query GetCatalogPackageEntity(
        $type: String!, 
        $name: String!
        ${!isLatestVersion ? ', $version: String!' : ''}
    ) {
        package(type: $type, name: $name) {
            name
            description
            vcsUrl
            homepage
            latestVersion {
                version
                published
                licenseInfo {
                    expression
                }
            }
            ${isLatestVersion ? `
                licenseInfo {
                    expression
                }
            ` : `
                versions(first: 1, where: { version: $version }) {
                    edges {
                        node {
                            version
                            published
                            licenseInfo {
                                expression
                            }
                        }
                    }
                }
            `}
            securityInfo {
                maliciousInfo {
                    knownToBeMalicious
                }
            }
        }
    }`;

    const variables = {
        type: options.type,
        name: options.name,
        ...((!isLatestVersion && options.version) ? { version: options.version } : {})
    };

    function processResponse(response: unknown) {
        const validatedResponse = JFrogCatalogGraphQLResponseSchema.parse(response);
        if (!validatedResponse.data?.package) {
            throw new Error("Package information not found in Catalog.");
        }

        const packageData = validatedResponse.data.package;
        
        // Process license information for latest version
        if (isLatestVersion && packageData.licenseInfo?.expression) {
            const topLevelLicenseExpression = packageData.licenseInfo.expression;
            const latestVersionLicenseExpression = packageData.latestVersion?.licenseInfo?.expression;

            if (latestVersionLicenseExpression && latestVersionLicenseExpression !== topLevelLicenseExpression) {
                console.warn(
                    `Package.license value is different from Package.latestVersion.license value. ` +
                    `Package.license: ${topLevelLicenseExpression}, ` +
                    `Package.latestVersion.license: ${latestVersionLicenseExpression}. ` +
                    `Using Package.license as the source of truth.`
                );
            }

            packageData.latestVersion = packageData.latestVersion || {
                version: '',
                published: '',
                licenseInfo: { expression: topLevelLicenseExpression }
            };
            delete packageData.licenseInfo;
        }

        // Process specific version information
        if (!isLatestVersion && packageData.versions?.edges?.[0]?.node) {
            packageData.version = packageData.versions.edges[0].node;
            delete packageData.versions;
        }

        // Handle potentially null securityInfo more gracefully
        const finalResult = {
            ...packageData,
            isMalicious: packageData.securityInfo && 
                         typeof packageData.securityInfo === 'object' && 
                         packageData.securityInfo.maliciousInfo && 
                         typeof packageData.securityInfo.maliciousInfo === 'object' && 
                         'knownToBeMalicious' in packageData.securityInfo.maliciousInfo ? 
                         Boolean(packageData.securityInfo.maliciousInfo.knownToBeMalicious) : 
                         false
        };
        
        delete finalResult.securityInfo;
        return finalResult;
    }

    const processedData = await jfrogRequest(
        "xray/catalog/graphql",
        {
            method: "POST",
            body: JSON.stringify({ query, variables })
        },
        processResponse
    );

    return processedData;
}

export async function getPackageVersions(options: JFrogCatalogPackageSchema) {
  const query = `query GetCatalogPackageVersions($type: String!, $name: String!, $first: Int) {
      package(type: $type, name: $name) {
        name
        description
        vcsUrl
        homepage
        versions(first: $first, orderBy: {field: PUBLISHED, direction: DESC}) {
          edges {
            node {
              version
              published
              licenseInfo {
                expression
              }
            }
          }
        }
      }
    }`;

  const variables = {
      type: options.type,
      name: options.name,
      first: 10
  };

  function processResponse(response: unknown): JFrogCatalogPackageVersionResponseSchema[] {
      console.log('Raw JFrog Catalog API Response:', JSON.stringify(response, null, 2));

      const validatedResponse = JFrogCatalogGraphQLResponseSchema.parse(response);
      if (!validatedResponse.data?.package?.versions?.edges) {
          throw new Error("Invalid response format from JFrog API: Missing required data");
      }

      return validatedResponse.data.package.versions.edges.map(edge => ({
          version: edge.node.version,
          published: edge.node.published,
          licenseInfo: edge.node.licenseInfo
      }));
  }

  const processedData = await jfrogRequest(
      "xray/catalog/graphql",
      {
          method: "POST",
          body: JSON.stringify({ query, variables })
      },
      (response) => processResponse(response)
  );

  if (!Array.isArray(processedData)) {
      throw new Error("Invalid processed data format. Expected an array.");
  }

  return JFrogCatalogPackageVersionResponseSchema.array().parse(processedData);
}

export async function getPackageVersionVulnerabilities(options: JFrogCatalogPackageVersionVulnerabilitiesSchema) {
    const query = `query GetCatalogPackageVersionVulnerabilities(
        $type: String!, 
        $name: String!, 
        $version: String!,
        $first: Int!,
        $orderBy: VulnerabilityOrder!
    ) {
        packageVersion(type: $type, name: $name, version: $version) {
            vulnerabilities(
                first: $first,
                orderBy: $orderBy
            ) {
                edges {
                    node {
                        name
                        description
                        severity
                    }
                }
            }
        }
    }`;

    const variables = {
        type: options.type,
        name: options.name,
        version: options.version,
        first: options.pageSize,
        orderBy: {
            field: "SEVERITY_VALUE",
            direction: "DESC"
        }
    };

    function processResponse(response: unknown) {
        const validatedResponse = z.object({
            data: z.object({
                packageVersion: z.object({
                    vulnerabilities: z.object({
                        edges: z.array(z.object({
                            node: JFrogCatalogVulnerabilityResponseSchema
                        }))
                    })
                }).nullable()
            })
        }).parse(response);

        if (!validatedResponse.data.packageVersion) {
            return [];
        }

        return validatedResponse.data.packageVersion.vulnerabilities.edges.map(edge => edge.node);
    }

    const processedData = await jfrogRequest(
        "xray/catalog/graphql",
        {
            method: "POST",
            body: JSON.stringify({ query, variables })
        },
        processResponse
    );

    return JFrogCatalogVulnerabilityResponseSchema.array().parse(processedData);
}

export async function getVulnerabilityInfo(options: JFrogCatalogVulnerabilityQuerySchema) {
    const query = `query GetCatalogVulnerabilityInfo(
        $cveId: String!,
        $pageSize: Int!
    ) {
        vulnerability(name: $cveId, ecosystem: "generic") {
            name
            description
            severity
            vulnerablePackages(first: $pageSize) {
                edges {
                    node {
                        packageVersion {
                            version
                            package {
                                type
                                name
                            }
                        }
                    }
                }
            }
        }
    }`;

    const variables = {
        cveId: options.cve_id,
        pageSize: options.pageSize
    };

    function processResponse(response: unknown) {
        const validatedResponse = z.object({
            data: z.object({
                vulnerability: z.object({
                    name: z.string(),
                    description: z.string(),
                    severity: z.enum(["Critical", "High", "Medium", "Low", "Unknown"]),
                    vulnerablePackages: z.object({
                        edges: z.array(z.object({
                            node: z.object({
                                packageVersion: z.object({
                                    version: z.string(),
                                    package: z.object({
                                        type: z.string(),
                                        name: z.string()
                                    })
                                })
                            })
                        }))
                    })
                }).nullable()
            })
        }).parse(response);

        if (!validatedResponse.data.vulnerability) {
            return null;
        }

        const vulnerability = validatedResponse.data.vulnerability;
        return {
            name: vulnerability.name,
            description: vulnerability.description,
            severity: vulnerability.severity,
            vulnerablePackages: vulnerability.vulnerablePackages.edges.map(edge => ({
                type: edge.node.packageVersion.package.type,
                name: edge.node.packageVersion.package.name,
                version: edge.node.packageVersion.version
            }))
        };
    }

    const processedData = await jfrogRequest(
        "xray/catalog/graphql",
        {
            method: "POST",
            body: JSON.stringify({ query, variables })
        },
        processResponse
    );

    if (!processedData) {
        throw new Error(`Vulnerability information not found for CVE ID: ${options.cve_id}`);
    }

    return processedData;
}

const getCatalogPackageEntityTool = {
    name: "jfrog_get_package_info",
    description: "Useful for when you need to get publicly available information about a software package. " +
        "it will provide you with the following information on it, if available in public sources: " +
        "a short description of the package, its latest published version, the software license " +
        "this software is distributed under, along with urls of its version control system, " +
        "its homepage and whether it is known to be a malicious package (in any version).",
    inputSchema: zodToJsonSchema(JFrogCatalogPackageVersionSchema),
    outputSchema: zodToJsonSchema(JFrogCatalogPackageVersionSchema),
    handler: async (args: any) => {
      const parsedArgs = JFrogCatalogPackageVersionSchema.parse(args);
      return await getPackageInfo(parsedArgs);
    }
};

const getCatalogPackageVersionsTool = {
    name: "jfrog_get_package_versions",
    description: "Useful for when you need to get a list of versions of a publicly available package. " +
        "it can tell you each version's publication date. Can also filter based on version vulnerability status.",
    inputSchema: zodToJsonSchema(JFrogCatalogPackageSchema),
    outputSchema: zodToJsonSchema(JFrogCatalogPackageVersionResponseSchema),
    handler: async (args: any) => {
      const parsedArgs = JFrogCatalogPackageSchema.parse(args);
      return await getPackageVersions(parsedArgs);
    }
};

const getCatalogPackageVersionVulnerabilitiesTool = {
    name: "jfrog_get_package_version_vulnerabilities",
    description: "Useful for when you need the list of known vulnerabilities affecting a specific version of an open source package.",
    inputSchema: zodToJsonSchema(JFrogCatalogPackageVersionVulnerabilitiesSchema),
    outputSchema: zodToJsonSchema(JFrogCatalogVulnerabilityResponseSchema),
    handler: async (args: any) => {
      const parsedArgs = JFrogCatalogPackageVersionVulnerabilitiesSchema.parse(args);
      return await getPackageVersionVulnerabilities(parsedArgs);
    }
};

const getCatalogVulnerabilityInfoTool = {
    name: "jfrog_get_vulnerability_info",
    description: "Useful for when you need to get a specific vulnerability information, including its affected packages and versions.",
    inputSchema: zodToJsonSchema(JFrogCatalogVulnerabilityQuerySchema),
    outputSchema: zodToJsonSchema(JFrogCatalogVulnerabilityResponseSchema),
    handler: async (args: any) => {
      const parsedArgs = JFrogCatalogVulnerabilityQuerySchema.parse(args);
      return await getVulnerabilityInfo(parsedArgs);
    }
};

export const CatalogTools = [
    getCatalogPackageEntityTool, 
    getCatalogPackageVersionsTool,
    getCatalogPackageVersionVulnerabilitiesTool,
    getCatalogVulnerabilityInfoTool
];
