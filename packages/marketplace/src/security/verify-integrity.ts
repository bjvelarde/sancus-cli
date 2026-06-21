import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export async function calculateSha256(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);

  return createHash("sha256").update(buffer).digest("hex");
}

export async function verifySha256(
  filePath: string,
  expected: string,
): Promise<boolean> {
  const actual = await calculateSha256(filePath);

  return actual.toLowerCase() === expected.toLowerCase();
}
