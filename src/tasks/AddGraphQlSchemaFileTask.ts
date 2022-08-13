import { existsSync } from "fs";
import fs from "fs/promises";
import { EOL } from "os";
import { TaskBase } from "../TaskBase.js";
import { ProjectSettings } from "../types.js";

const schemaGraphQLContent = `# Replace this with your own GraphQL schema file!${EOL}type Query {${EOL}  field: String${EOL}}${EOL}`;

export class AddGraphQlSchemaFileTask extends TaskBase {
  constructor(private settings: ProjectSettings) {
    super();
  }

  async run(): Promise<void> {
    if (existsSync(this.settings.schemaFilePath)) {
      this.skip("File exists");
    }

    await fs.writeFile(
      this.settings.schemaFilePath,
      schemaGraphQLContent,
      "utf-8"
    );
  }
}
