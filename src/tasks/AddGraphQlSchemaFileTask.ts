import chalk from "chalk";
import { existsSync, promises as fs } from "fs";
import { EOL } from "os";
import { TaskBase } from "../TaskBase.js";

const schemaGraphQLContent = `# Replace this with your own GraphQL schema file!${EOL}type Query {${EOL}  field: String${EOL}}${EOL}`;

export class AddGraphQlSchemaFileTask extends TaskBase {
  constructor(private schemaFilePath: string) {
    super();
  }

  async run(): Promise<void> {
    if (existsSync(this.schemaFilePath)) {
      this.skip("File exists");
    }

    await fs.writeFile(this.schemaFilePath, schemaGraphQLContent, "utf-8");
  }
}
