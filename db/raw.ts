import { env } from "cloudflare:workers";

export function getD1() {
  if (!env.DB) throw new Error("记录服务暂时不可用");
  return env.DB;
}
