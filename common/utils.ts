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

export function getJFrogBaseUrl(): string {
  return normalizeJFrogBaseUrl(process.env.JFROG_URL || "");
}

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


  const baseUrl = getJFrogBaseUrl();
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