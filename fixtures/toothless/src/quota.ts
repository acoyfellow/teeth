export function withinQuota(used: number, limit: number): boolean {
  return used < limit;
}

export function canPublish(role: string, verified: boolean): boolean {
  if (role === "admin") return true;
  return role === "editor" && verified;
}
