import { getUserAgent } from "universal-user-agent";
import { createJFrogError } from "./errors.js";
import { VERSION } from "./version.js";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  JFrogError,
  JFrogValidationError,
  JFrogResourceNotFoundError,
  JFrogAuthenticationError,
  JFrogPermissionError,
  JFrogRateLimitError,
  JFrogConflictError,
  isJFrogError,
} from "./errors.js";
type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}



async function parseResponseBody(response: AxiosResponse): Promise<unknown> {
  const contentType = response.headers["content-type"];
  if (contentType?.includes("application/json")) {
    return response.data;
  }
  return response.data;
}

export function buildUrl(baseUrl: string, params: Record<string, string | number | undefined>): string {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, value.toString());
    }
  });
  return url.toString();
}

const USER_AGENT = `modelcontextprotocol/servers/jfrog/v${VERSION} ${getUserAgent()}`;

/**
 * Normalizes a JFrog base URL by ensuring it ends with a trailing slash
 * @param baseUrl The base URL to normalize
 * @returns The normalized base URL with a trailing slash
 */
export function normalizeJFrogBaseUrl(baseUrl: string): string {
  if (!baseUrl) {
    return "";
  }
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

export async function jfrogRequest(
  urlPath: string,
  options: RequestOptions = {},
  postProcess: (data: unknown) => unknown = (x) => x
): Promise<unknown> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": USER_AGENT,
    ...options.headers,
  };

  if (process.env.JFROG_ACCESS_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.JFROG_ACCESS_TOKEN}`;
  }


  const baseUrl = normalizeJFrogBaseUrl(process.env.JFROG_URL || "");
  const path = urlPath.startsWith("/") ? urlPath.substring(1) : urlPath;
  const url = baseUrl ? `${baseUrl}${path}` : urlPath;

  try {
    const axiosConfig: AxiosRequestConfig = {
      method: options.method || "GET",
      url,
      headers,
      data: options.body,
    };

    const response = await axios(axiosConfig);
    return postProcess(response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw createJFrogError(error.response.status, error.response.data);
    }
    throw error;
  }
}

export function formatJFrogError(error: JFrogError): string {
  let message = `JFrog API Error: ${error.message}`;

  if (error instanceof JFrogValidationError) {
    message = `Validation Error: ${error.message}`;
    if (error.response) {
      message += `\nDetails: ${JSON.stringify(error.response)}`;
    }
  } else if (error instanceof JFrogResourceNotFoundError) {
    message = `Not Found: ${error.message}`;
  } else if (error instanceof JFrogAuthenticationError) {
    message = `Authentication Failed: ${error.message}`;
  } else if (error instanceof JFrogPermissionError) {
    message = `Permission Denied: ${error.message}`;
  } else if (error instanceof JFrogRateLimitError) {
    message = `Rate Limit Exceeded: ${error.message}\nResets at: ${error.resetAt.toISOString()}`;
  } else if (error instanceof JFrogConflictError) {
    message = `Conflict: ${error.message}`;
  }

  return message;
}

export function validateBranchName(branch: string): string {
  const sanitized = branch.trim();
  if (!sanitized) {
    throw new Error("Branch name cannot be empty");
  }
  if (sanitized.includes("..")) {
    throw new Error("Branch name cannot contain '..'");
  }
  if (/[\s~^:?*[\\\]]/.test(sanitized)) {
    throw new Error("Branch name contains invalid characters");
  }
  if (sanitized.startsWith("/") || sanitized.endsWith("/")) {
    throw new Error("Branch name cannot start or end with '/'");
  }
  if (sanitized.endsWith(".lock")) {
    throw new Error("Branch name cannot end with '.lock'");
  }
  return sanitized;
}

export function validateRepositoryName(name: string): string {
  const sanitized = name.trim().toLowerCase();
  if (!sanitized) {
    throw new Error("Repository name cannot be empty");
  }
  if (!/^[a-z0-9_.-]+$/.test(sanitized)) {
    throw new Error(
      "Repository name can only contain lowercase letters, numbers, hyphens, periods, and underscores"
    );
  }
  if (sanitized.startsWith(".") || sanitized.endsWith(".")) {
    throw new Error("Repository name cannot start or end with a period");
  }
  return sanitized;
}

export function validateOwnerName(owner: string): string {
  const sanitized = owner.trim().toLowerCase();
  if (!sanitized) {
    throw new Error("Owner name cannot be empty");
  }
  if (!/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/.test(sanitized)) {
    throw new Error(
      "Owner name must start with a letter or number and can contain up to 39 characters"
    );
  }
  return sanitized;
}

export async function checkBranchExists(
  owner: string,
  repo: string,
  branch: string
): Promise<boolean> {
  try {
    await jfrogRequest(
      `repos/${owner}/${repo}/branches/${branch}`
    );
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && error.status === 404) {
      return false;
    }
    throw error;
  }
}

export async function checkUserExists(username: string): Promise<boolean> {
  try {
    await jfrogRequest(`users/${username}`);
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && error.status === 404) {
      return false;
    }
    throw error;
  }
}