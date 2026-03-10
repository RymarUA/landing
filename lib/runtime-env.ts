type NodeEnv = "development" | "production" | "test";

let cachedNodeEnv: NodeEnv | null = null;

function detectNodeEnv(): NodeEnv {
  const envFromGlobal =
    typeof globalThis !== "undefined"
      ? ((globalThis as any).process?.env?.NODE_ENV as NodeEnv | undefined)
      : undefined;

  const nodeEnv = envFromGlobal ?? process.env.NODE_ENV ?? "development";
  if (nodeEnv === "production" || nodeEnv === "test") {
    return nodeEnv;
  }
  return "development";
}

export function getNodeEnv(): NodeEnv {
  if (cachedNodeEnv) {
    return cachedNodeEnv;
  }
  cachedNodeEnv = detectNodeEnv();
  return cachedNodeEnv;
}

export function isDevelopmentEnv() {
  return getNodeEnv() === "development";
}

export function isProductionEnv() {
  return getNodeEnv() === "production";
}

export function isBrowserEnv() {
  return typeof window !== "undefined";
}
