# JFrog MCP Server

MCP Server for the JFrog Platform API, enabling repository management, build tracking, release lifecycle management, and more.

## Features

- **Repository Management**: Create and manage local, remote, and virtual repositories
- **Build Tracking**: List and retrieve build information
- **Release Lifecycle Management**: Create, promote, and distribute release bundles
- **Runtime Monitoring**: View runtime clusters and running container images
- **Access Control**: Manage projects and environments
- **Mission Control**: View associated JFrog Platform instances
- **Artifact Search**: Execute powerful AQL queries to search for artifacts and builds

## Tools

### Repository Management

1. `check_jfrog_availability`
   - Check if JFrog platform is ready and functioning
   - Returns: Platform readiness status

2. `create_local_repository`
   - Create a new local repository in Artifactory
   - Inputs:
     - `key` (string): Repository key
     - `rclass` (string): Repository class (must be "local")
     - `packageType` (string): Package type of the repository
     - `description` (optional string): Repository description
     - `projectKey` (optional string): Project key to assign the repository to
     - `environments` (optional string[]): Environments to assign the repository to
   - Returns: Created repository details

3. `create_remote_repository`
   - Create a new remote repository in Artifactory to proxy external package registries
   - Inputs:
     - `key` (string): Repository key
     - `rclass` (string): Repository class (must be "remote")
     - `packageType` (string): Package type of the repository
     - `url` (string): URL to the remote repository
     - `username` (optional string): Remote repository username
     - `password` (optional string): Remote repository password
     - `description` (optional string): Repository description
     - `projectKey` (optional string): Project key to assign the repository to
     - `environments` (optional string[]): Environments to assign the repository to
     - Many other optional parameters for specific repository configurations
   - Returns: Created repository details

4. `create_virtual_repository`
   - Create a new virtual repository in Artifactory that aggregates multiple repositories
   - Inputs:
     - `key` (string): Repository key
     - `rclass` (string): Repository class (must be "virtual")
     - `packageType` (string): Package type of the repository
     - `repositories` (string[]): List of repository keys to include in the virtual repository
     - `description` (optional string): Repository description
     - `projectKey` (optional string): Project key to assign the repository to
     - `environments` (optional string[]): Environments to assign the repository to
     - Other optional parameters for specific repository configurations
   - Returns: Created repository details

5. `list_repositories`
   - List all repositories in Artifactory with optional filtering
   - Inputs:
     - `type` (optional string): Filter repositories by type (local, remote, virtual, federated, distribution)
     - `packageType` (optional string): Filter repositories by package type
     - `project` (optional string): Filter repositories by project key
   - Returns: List of repositories matching the filters

6. `set_folder_property`
   - Set properties on a folder in Artifactory, with optional recursive application
   - Inputs:
     - `folderPath` (string): Path to the folder where properties should be set
     - `properties` (object): Key-value pairs of properties to set
     - `recursive` (optional boolean): Whether to apply properties recursively to sub-folders
   - Returns: Operation result

7. `execute_aql_query`
   - Execute an Artifactory Query Language (AQL) query to search for artifacts, builds, or other entities in JFrog Artifactory
   - Inputs:
     - `query` (string): The AQL query to execute. Must follow AQL syntax (e.g., items.find({"repo":"my-repo"}).include("name","path"))
     - `domain` (optional string): The primary domain to search in (items, builds, archive.entries, build.promotions, releases)
     - `transitive` (optional boolean): Whether to search in remote repositories
     - `limit` (optional number): Maximum number of results to return
     - `offset` (optional number): Number of results to skip
     - `include_fields` (optional string[]): Fields to include in the results
     - `sort_by` (optional string): Field to sort results by
     - `sort_order` (optional string): Sort order (asc or desc)
   - Returns: Search results with metadata

### Build Management

8. `list_jfrog_builds`
   - Return a list of all builds in the JFrog platform
   - Returns: List of builds

9. `get_specific_build`
   - Get details for a specific build by name
   - Inputs:
     - `buildName` (string): Name of the build to retrieve
     - `project` (optional string): Project key to scope the build search
   - Returns: Build details

### Runtime Management

10. `list_jfrog_runtime_clusters`
    - Return a list of all runtime clusters in the JFrog platform
    - Inputs:
      - `limit` (optional integer): The maximum number of clusters to return
      - `next_key` (optional string): The next key to use for pagination
    - Returns: List of runtime clusters

11. `get_jfrog_runtime_specific_cluster`
    - Return a runtime cluster by ID
    - Inputs:
      - `clusterId` (integer): The ID of the cluster to retrieve
    - Returns: Cluster details

12. `list_jfrog_running_images`
    - List all running container images across runtime clusters with their security and operational status
    - Inputs:
      - `filters` (optional string): Filters to apply
      - `num_of_rows` (optional integer): Number of rows to return
      - `page_num` (optional integer): Page number
      - `statistics` (optional boolean): Whether to include statistics
      - `timePeriod` (optional string): Time period to query
    - Returns: List of running images

### Release Lifecycle Management

13. `create_release_bundle`
    - Create a release bundle in the JFrog platform
    - Inputs:
      - `release_bundle_name` (string): Name of the Release Bundle
      - `release_bundle_version` (string): Version of the Release Bundle
      - `source` (object): Source configuration with builds array
      - `source_type` (string): Type of source for the Release Bundle
      - `skip_docker_manifest_resolution` (optional boolean): Whether to skip Docker manifest resolution
    - Returns: Created release bundle details

14. `promote_release_bundle`
    - Promote a release bundle version by copying or moving its contents
    - Inputs:
      - `name` (string): Name of the Release Bundle to promote
      - `version` (string): Version of the Release Bundle to promote
      - `environment` (string): Target environment for promotion
      - `operation` (optional string): How to perform the promotion - copy (default) or move
      - `async` (optional boolean): Whether to run promotion asynchronously
      - `included_repository_keys` (optional string[]): List of repository keys to include in promotion
      - `excluded_repository_keys` (optional string[]): List of repository keys to exclude from promotion
    - Returns: Promotion operation result

15. `distribute_release_bundle`
    - Distribute a release bundle to a target environment
    - Inputs:
      - `name` (string): Name of the Release Bundle to distribute
      - `version` (string): Version of the Release Bundle to distribute
      - `distribution_rules` (optional object[]): Rules defining which distribution targets to include
      - `auto_create_missing_repositories` (optional boolean): Whether to automatically create missing repositories
      - `project` (optional string): Project key
      - `repository_key` (optional string): Repository key
      - `modifications` (optional object): Optional path mapping specifications for artifacts
    - Returns: Distribution operation result

### Access Control

16. `list_jfrog_environments`
    - Get a list of all environments types in the JFrog platform with their details
    - Inputs:
    - Returns: List of environments

17. `list_jfrog_projects`
    - Get a list of all projects in the JFrog platform with their details
    - Inputs:
    - Returns: List of projects

18. `get_specific_project`
    - Get detailed information about a specific project in the JFrog platform
    - Inputs:
      - `project_key` (string): The unique key of the project to retrieve
    - Returns: Project details

19. `create_project`
    - Create a new project in the JFrog platform
    - Inputs:
      - `project_key` (string): Unique identifier for the project
      - `display_name` (string): Display name of the project
      - `description` (string): Description of the project
      - `admin_privileges` (object): Administrative privileges for the project
      - `storage_quota_bytes` (number): Storage quota in bytes (-1 for unlimited)
    - Returns: Created project details

### Mission Control

20. `list_jfrog_associated_instances`
    - Get all JFrog Platform Deployment (JPD) instances associated with the current JFrog Platform
    - Returns: List of associated instances

## Setup

### JFrog Access Token
To use this MCP server, you need to create a JFrog Access Token with appropriate permissions:

For information on how to create a JFrog Access Token, please refer to the [JFrog Platform Access Tokens documentation](https://jfrog.com/help/r/jfrog-platform-administration-documentation/access-tokens).

### Usage with Claude Desktop
Add the following to your `claude_desktop_config.json`:

#### Docker
```json
{
  "mcpServers": { 
    "jfrog": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e",
        "JFROG_ACCESS_TOKEN",
        "-e",
        "JFROG_BASE_URL",
        "mcp/jfrog"
      ],
      "env": {
        "JFROG_ACCESS_TOKEN": "<YOUR_TOKEN>",
        "JFROG_BASE_URL": "https://your-instance.jfrog.io" // Your JFrog platform URL
      }
    }
  }
}
```

### NPX

```json
{
  "mcpServers": {
    "jfrog": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-jfrog"
      ],
      "env": {
        "JFROG_ACCESS_TOKEN": "<YOUR_TOKEN>",
        "JFROG_BASE_URL": "https://your-instance.jfrog.io" // Your JFrog platform URL
      }
    }
  }
}
```

## Build

Docker build:

```bash
docker build -t mcp/jfrog -f Dockerfile .
```

## Environment Variables

- `JFROG_ACCESS_TOKEN`: Your JFrog access token (required)
- `JFROG_BASE_URL`: Base URL for your JFrog platform (required)

## Disclaimer

This is an open source project and is not officially supported or endorsed by JFrog. JFrog is not responsible for any consequences resulting from the use of this MCP server. Results and functionality may vary depending on the Large Language Model (LLM) client that is using this MCP server.

All API endpoints used in this project are public endpoints that can also be found in JFrog's official documentation. However, the interpretation and handling of these endpoints by different LLMs may lead to varying results.

Users should verify any critical operations or information obtained through this MCP server against JFrog's official documentation or platform interface before taking action based on the results.


## License

This MCP server is licensed under the Apache License 2.0. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the Apache License 2.0. For more details, please see the LICENSE.md file in the project repository.