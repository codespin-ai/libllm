import { writeFile } from "fs/promises";
import path from "path";
import { access } from "fs/promises";
import { InitResult } from "../types.js";

export async function initializeConfig<T extends { apiKey: string }>(
  providerName: string,
  baseConfig: T,
  configDir: string,
  options: {
    storeKeysGlobally?: boolean;
    force?: boolean;
    globalConfigDir?: string;
  }
): Promise<InitResult> {
  const created: string[] = [];
  const skipped: string[] = [];
  const { storeKeysGlobally, force, globalConfigDir } = options;

  if (storeKeysGlobally && globalConfigDir) {
    const globalConfigPath = path.join(globalConfigDir, `${providerName}.json`);
    const localConfigPath = path.join(configDir, `${providerName}.json`);

    // If force is true, overwrite both files
    if (force) {
      await writeFile(
        globalConfigPath,
        JSON.stringify({ apiKey: baseConfig.apiKey }, null, 2)
      );
      created.push(globalConfigPath);

      const { apiKey: _, ...localConfig } = baseConfig;
      await writeFile(localConfigPath, JSON.stringify(localConfig, null, 2));
      created.push(localConfigPath);

      return { created, skipped };
    }

    // If force is not true, check each file separately
    try {
      await access(globalConfigPath);
      skipped.push(globalConfigPath);
    } catch {
      await writeFile(
        globalConfigPath,
        JSON.stringify({ apiKey: baseConfig.apiKey }, null, 2)
      );
      created.push(globalConfigPath);
    }

    try {
      await access(localConfigPath);
      skipped.push(localConfigPath);
    } catch {
      const { apiKey: _, ...localConfig } = baseConfig;
      await writeFile(localConfigPath, JSON.stringify(localConfig, null, 2));
      created.push(localConfigPath);
    }
  } else {
    const configPath = path.join(configDir, `${providerName}.json`);

    // If force is true, always overwrite
    if (force) {
      await writeFile(configPath, JSON.stringify(baseConfig, null, 2));
      created.push(configPath);
      return { created, skipped };
    }

    // If force is not true, only write if file doesn't exist
    try {
      await access(configPath);
      skipped.push(configPath);
    } catch {
      await writeFile(configPath, JSON.stringify(baseConfig, null, 2));
      created.push(configPath);
    }
  }

  return { created, skipped };
}
