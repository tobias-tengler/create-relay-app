import { existsSync } from "fs";
import fs from "fs-extra";
import path from "path";
import { EOL } from "os";
import { TaskBase } from "../TaskBase.js";
import { ProjectSettings } from "../types.js";

const schemaGraphQLContent = `# Replace this with your own GraphQL schema file!${EOL}type Query {${EOL}  field: String${EOL}}${EOL}`;

export class GenerateGraphQlSchemaFileTask extends TaskBase {
  constructor(private settings: ProjectSettings) {
    super();
  }

  async run(): Promise<void> {
    if (existsSync(this.settings.schemaFilePath)) {
      this.skip("File exists");
    }

    const dir = path.dirname(this.settings.schemaFilePath);

    // todo: handle error
    fs.mkdirSync(dir, { recursive: true });

    // todo: handle error
    await fs.writeFile(
      this.settings.schemaFilePath,
      schemaGraphQLContent,
      "utf-8"
    );
  }
}
