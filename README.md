# JFrog MCP Server (🧪 Experimental)

[![smithery badge](https://smithery.ai/badge/@jfrog/mcp-jfrog)](https://smithery.ai/server/@jfrog/mcp-jfrog)

Model Context Protocol (MCP) Server for the JFrog Platform API, enabling repository management, build tracking, release lifecycle management, and more.


https://github.com/user-attachments/assets/aca3af2b-f294-41c8-8727-799a019a55b5


## Disclaimer
This is an experimental project intended to demonstrate JFrog's capabilities with MCP. It is not officially supported or verified by JFrog.

## Features

- **Repository Management**: Create and manage local, remote, and virtual repositories
- **Build Tracking**: List and retrieve build information
- **Runtime Monitoring**: View runtime clusters and running container images
- **Mission Control**: View associated JFrog Platform instances
- **Artifact Search**: Execute powerful AQL queries to search for artifacts and builds
- **Catalog and Curation**: Access package information, versions, vulnerabilities, and check curation status
- **Xray**: Access scan artifacts summary, group by severity per artifact

## Tools

<details>
<summary><strong>Repository Management</strong></summary>

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
</details>

<details>
<summary><strong>Build Management</strong></summary>

8. `list_jfrog_builds`
   - Return a list of all builds in the JFrog platform
   - Returns: List of builds

9. `get_specific_build`
   - Get details for a specific build by name
   - Inputs:
     - `buildName` (string): Name of the build to retrieve
     - `project` (optional string): Project key to scope the build search
   - Returns: Build details
</details>

<details>
<summary><strong>Runtime Management</strong></summary>

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
</details>

<details>
<summary><strong>Access Control</strong></summary>

13. `list_jfrog_environments`
    - Get a list of all environments types in the JFrog platform with their details
    - Inputs:
    - Returns: List of environments

14. `list_jfrog_projects`
    - Get a list of all projects in the JFrog platform with their details
    - Inputs:
    - Returns: List of projects

15. `get_specific_project`
    - Get detailed information about a specific project in the JFrog platform
    - Inputs:
      - `project_key` (string): The unique key of the project to retrieve
    - Returns: Project details

16. `create_project`
    - Create a new project in the JFrog platform
    - Inputs:
      - `project_key` (string): Unique identifier for the project
      - `display_name` (string): Display name of the project
      - `description` (string): Description of the project
      - `admin_privileges` (object): Administrative privileges for the project
      - `storage_quota_bytes` (number): Storage quota in bytes (-1 for unlimited)
    - Returns: Created project details
</details>

<details>
<summary><strong>Catalog and Curation</strong></summary>

17. `jfrog_get_package_info`
    - Get publicly available information about a software package
    - Inputs:
      - `type` (string): The type of package (pypi, npm, maven, golang, nuget, huggingface, rubygems)
      - `name` (string): The name of the package, as it appears in the package repository
      - `version` (optional string): The version of the package (default: "latest")
    - Returns: Package information including description, latest version, license, and URLs

18. `jfrog_get_package_versions`
    - Get a list of versions of a publicly available package with publication dates
    - Inputs:
      - `type` (string): The type of package (pypi, npm, maven, golang, nuget, huggingface, rubygems)
      - `name` (string): The name of the package, as it appears in the package repository
    - Returns: List of package versions with publication dates

19. `jfrog_get_package_version_vulnerabilities`
    - Get a list of known vulnerabilities affecting a specific version of an open source package
    - Inputs:
      - `type` (string): The type of package (pypi, npm, maven, golang, nuget, huggingface, rubygems)
      - `name` (string): The name of the package, as it appears in the package repository
      - `version` (optional string): The version of the package (default: "latest")
      - `pageSize` (optional number): Number of vulnerabilities to return per page (default: 10)
      - `pageCount` (optional number): Number of pages to return (default: 1)
    - Returns: List of vulnerabilities affecting the specified package version

20. `jfrog_get_vulnerability_info`
    - Get detailed information about a specific vulnerability, including affected packages and versions
    - Inputs:
      - `cve_id` (string): The CVE ID or vulnerability identifier to look up
      - `pageSize` (optional number): Number of vulnerabilities to return per page (default: 10)
      - `pageCount` (optional number): Number of pages to return (default: 1)
    - Returns: Detailed vulnerability information and affected packages

21. `jfrog_get_package_curation_status`
    - Check the curation status of a specific package version
    - Inputs:
      - `packageType` (string): The type of package (pypi, npm, maven, golang, nuget, huggingface, rubygems)
      - `packageName` (string): The name of the package, as it appears in the package repository
      - `packageVersion` (string): The version of the package, as it appears in the package repository
    - Returns: Curation status (approved, blocked, or inconclusive)
</details>

<details>
<summary><strong>Xray</strong></summary>

22. `jfrog_get_artifacts_summary`
    - Get artifacts issues summary in a repository or build, categorized and counted by severity (Low, Medium, High, Critical, Unkown)
    - Inputs:
      - `paths` (string array): An array of paths to the artifacts from which to create the summary from
    - Returns: A summary based on vulnerability count per severity for each artifact in the provided array plus the total issues
</details>

## Setup

### Installing via Smithery

To install mcp-jfrog for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@jfrog/mcp-jfrog):

```bash
npx -y @smithery/cli install @jfrog/mcp-jfrog --client claude
```

### Prerequisites

- Node.js v18 or higher
- Docker (if using Docker deployment, [See Docker Deployment](https://github.com/jfrog/mcp-jfrog/blob/main/README.md#docker) )
- A valid JFrog platform instance with appropriate permissions
- Access to create and manage access tokens in your JFrog platform instance

## Environment Variables

- `JFROG_ACCESS_TOKEN`: Your JFrog access token (required)
- `JFROG_URL`: Base URL for your JFrog platform (required)
- `TRANSPORT`: Transport mode to use, set to 'sse' to enable SSE transport (default: stdio)
- `PORT`: Port number to use for SSE transport (default: 8080)
- `CORS_ORIGIN`: CORS origin allowed for SSE connections (default: '*')
- `LOG_LEVEL`: Logging level: DEBUG, INFO, WARN, ERROR (default: INFO)
- `MAX_RECONNECT_ATTEMPTS`: Maximum number of reconnection attempts for SSE server (default: 5)
- `RECONNECT_DELAY_MS`: Base delay in milliseconds between reconnection attempts (default: 2000)

### JFrog Token (`JFROG_ACCESS_TOKEN`)
To use this MCP server, you need to create a JFrog Access Token or use an Idenetity token with appropriate permissions:

For information on how to create a JFrog Token, please refer to the JFrog official documentations:

- [Identity Tokens](https://jfrog.com/help/r/platform-api-key-deprecation-and-the-new-reference-tokens/introducing-jfrog-access-and-identity-tokens)

- [Access Tokens](https://jfrog.com/help/r/jfrog-platform-administration-documentation/access-tokens)

### JFrog URL (`JFROG_URL`)

Your JFrog platform instance URL (e.g. https://acme.jfrog.io)

### SSE Transport Features

The SSE transport mode includes the following features:

- **Connection Management**: Each SSE connection is tracked with a unique ID, allowing clients to maintain state across reconnections.
- **Structured Logging**: Detailed logs with timestamps, severity levels, and relevant contextual information.
- **Connection Resilience**: Automatic reconnection attempts with exponential backoff if the server fails to start.
- **Health Endpoint**: A `/health` endpoint that returns server status information.
- **Connection Tracking**: Real-time tracking of active connections with periodic statistics logging.
- **Performance Metrics**: Execution time tracking for tool operations and HTTP requests.

When using SSE mode:

1. Clients should connect to the `/sse` endpoint, optionally providing a `connectionId` query parameter for session tracking.
2. Client requests should be sent to the `/messages` endpoint with the same `connectionId` as a query parameter.
3. The server will respond with server-sent events through the established SSE connection.

Example client connection with connection ID:
```
GET /sse?connectionId=client123
```

Example client request:
```
POST /messages?connectionId=client123
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "listTools",
  "id": 1
}
```

### How to build

Clone the repo to your local machine using `git clone` and `cd` into the project directory:

```bash
git clone git@github.com:jfrog/mcp-jfrog.git

cd mcp-jfrog
```

Build as a Docker image:

```bash
docker build -t mcp/jfrog -f Dockerfile .
```

Build as an npm module: 

```bash
npm i && npm run build
```


## Usage

<details>
<summary><strong>Use with Cursor</strong></summary>
Add the following to your `~/.cursor/mcp.json`:

### npm

```json
{
  "mcpServers": {
    "MCP-JFrog": { 
      "command": "npm",
      "args": [
        "exec",
        "-y",
        "github:jfrog/mcp-jfrog"
      ],
      "env": {
        "JFROG_ACCESS_TOKEN": "ACCESS_TOKEN",
        "JFROG_URL": "https://<YOUR_JFROG_INSTANCE_URL>"
      }
    }
  },
  "mcp-local-dev":{
      "command": "node",
      "args": [
        "/<ABSOLUT_PATH_TO>/mcp-jfrog/dist/index.js"
      ],
      "env": {
        "JFROG_ACCESS_TOKEN": "<ACCESS_TOKEN>>",
        "JFROG_URL": "<JFROG_URL>"
      }
    }
}
```

### Docker
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
        "JFROG_URL",
        "mcp/jfrog"
      ],
      "env": {
        "JFROG_ACCESS_TOKEN": "<YOUR_TOKEN>",
        "JFROG_URL": "https://your-instance.jfrog.io"
      },
      "serverUrl": "http://localhost:8080/sse"
    }
  }
}
```

### SSE Transport Mode

To use the JFrog MCP Server with SSE transport mode (useful for web interfaces like Cursor's webview):

```json
{
  "mcpServers": { 
    "jfrog-sse": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-p",
        "8080:8080",
        "-e",
        "TRANSPORT=sse",
        "-e",
        "PORT=8080",
        "-e",
        "CORS_ORIGIN=*",
        "-e",
        "LOG_LEVEL=INFO",
        "-e",
        "MAX_RECONNECT_ATTEMPTS=5",
        "-e",
        "RECONNECT_DELAY_MS=2000",
        "-e",
        "JFROG_ACCESS_TOKEN",
        "-e",
        "JFROG_URL",
        "mcp/jfrog"
      ],
      "env": {
        "JFROG_ACCESS_TOKEN": "<YOUR_TOKEN>",
        "JFROG_URL": "https://your-instance.jfrog.io",
        "serverUrl": "http://localhost:8080/sse"
      }
    }
  }
}
```

Note: For SSE mode, you need to add the `serverUrl` parameter pointing to your SSE endpoint, and expose the port used by the server (-p 8080:8080).
</details>

<details>
<summary><strong>Use with Claude Desktop</strong></summary>


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
        "JFROG_URL",
        "mcp/jfrog"
      ],
      "env": {
        "JFROG_ACCESS_TOKEN": "<YOUR_TOKEN>",
        "JFROG_URL": "https://your-instance.jfrog.io" // Your JFrog platform URL
      },
      "serverUrl": "http://localhost:8080/sse"
    }
  }
}
```

### npm

```json
{
"mcpServers": {
    "MCP-JFrog": { 
      "command": "npm",
      "args": [
        "exec",
        "-y",
        "github:jfrog/mcp-jfrog"
      ],
      "env": {
        "JFROG_ACCESS_TOKEN": "ACCESS_TOKEN",
        "JFROG_URL": "https://<YOUR_JFROG_INSTANCE_URL>"
      }
    }
  }
}
```

### SSE Transport Mode

For Claude Desktop with SSE transport:

```json
{
  "mcpServers": { 
    "jfrog-sse": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-p",
        "8080:8080",
        "-e",
        "TRANSPORT=sse",
        "-e",
        "PORT=8080",
        "-e",
        "CORS_ORIGIN=*",
        "-e",
        "LOG_LEVEL=INFO",
        "-e",
        "MAX_RECONNECT_ATTEMPTS=5",
        "-e",
        "RECONNECT_DELAY_MS=2000",
        "-e",
        "JFROG_ACCESS_TOKEN",
        "-e",
        "JFROG_URL",
        "mcp/jfrog"
      ],
      "env": {
        "JFROG_ACCESS_TOKEN": "<YOUR_TOKEN>",
        "JFROG_URL": "https://your-instance.jfrog.io",
        "serverUrl": "http://localhost:8080/sse"
      }
    }
  }
}
```
```
</details>


## License

This MCP server is licensed under the Apache License 2.0. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the Apache License 2.0. For more details, please see the LICENSE.md file in the project repository.
