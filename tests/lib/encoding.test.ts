import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

function collectTsFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectTsFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

describe("encoding de fuentes", () => {
  it("src/ no contiene caracteres de reemplazo U+FFFD (mojibake)", () => {
    const root = path.join(fileURLToPath(new URL(".", import.meta.url)), "..", "..", "src");
    const broken = collectTsFiles(root).filter((file) =>
      readFileSync(file, "utf8").includes("\uFFFD")
    );
    expect(broken).toEqual([]);
  });
});
