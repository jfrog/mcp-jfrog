interface PlatformContext {
    /**
     * HTTP clients to perform requests to your JFrog platform or to the outside
     */
    clients: PlatformClients;
    /**
     * Utility to get access to your Worker's secrets
     */
    secrets: PlatformSecrets;
    /**
     * Utility to get access to your Worker's properties
     */
    properties: PlatformProperties;
    /**
     * Token used when communicating with the JFrog platform
     */
    platformToken: string;
    /**
     * Will wait for the number of millisecond.
     * The waiting time is limited by the execution time of the function.
     * @param {number} delayMs - The number of milliseconds to wait
     */
    wait(delayMs: number): Promise<void>;
}

interface PlatformClients {
    /**
     * HTTP client to perform requests to your JFrog platform
     */
    platformHttp: PlatformHttpClient
    /**
     * HTTP client (axios) to perform requests to the outside
     */
    axios: AxiosInstance
}

interface PlatformSecrets {
    /**
     * Retrieves a secret by its key
     * @param {string} secretKey - The secret key
     */
    get(secretKey: string): string;
}

interface PlatformProperties {
    /**
     * Retrieves a Worker's property by its key
     * @param {string} propertyKey - The property key
     */
    get(propertyKey: string): string;
}

interface PlatformHttpClient {
    /**
     * Perform http GET request to JFrog platform
     * @param {string} endpoint - API endpoint. E.g. /artifactory/api/repositories
     * @param {Record<string, string>} headers - additional headers used in the request
     */
    get(endpoint: string, headers?: Record<string, string>): Promise<IPlatformHttpResponse>;

    /**
     * Perform http POST request to JFrog platform
     * @param {string} endpoint - API endpoint. E.g. /artifactory/api/repositories
     * @param {any} requestData - data sent in request body
     * @param {Record<string, string>} headers - additional headers used in the request
     */
    post(endpoint: string, requestData?: any, headers?: Record<string, string>): Promise<IPlatformHttpResponse>;

    /**
     * Perform http PUT request to JFrog platform
     * @param {string} endpoint - API endpoint. E.g. /artifactory/api/repositories
     * @param {any} requestData - data sent in request body
     * @param {Record<string, string>} headers - additional headers used in the request
     */
    put(endpoint: string, requestData?: any, headers?: Record<string, string>): Promise<IPlatformHttpResponse>;

    /**
     * Perform http PATCH request to JFrog platform
     * @param {string} endpoint - API endpoint. E.g. /artifactory/api/repositories
     * @param {any} requestData - data sent in request body
     * @param {Record<string, string>} headers - additional headers used in the request
     */
    patch(endpoint: string, requestData?: any, headers?: Record<string, string>): Promise<IPlatformHttpResponse>;

    /**
     * Perform http DELETE request to JFrog platform
     * @param {string} endpoint - API endpoint. E.g. /artifactory/api/repositories
     * @param {Record<string, string>} headers - additional headers used in the request
     */
    delete(endpoint: string, headers?: Record<string, string>): Promise<IPlatformHttpResponse>;
}

interface IPlatformHttpResponse {
    /**
     * Http status
     */
    status: number;
    /**
     * Response headers
     */
    headers: Record<string, string>;
    /**
     * Parsed response body (as json)
     */
    data: any;
}

interface PlatformHttpClientError {
    /**
     * The reason of the error
     */
    message: string;

    /**
     * Http status
     */
    status: number;
}
