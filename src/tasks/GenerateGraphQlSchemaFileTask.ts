import path from "path";
import { EOL } from "os";
import { TaskBase } from "./TaskBase.js";
import { ProjectSettings } from "../types.js";
import { createDirectory, writeToFile, doesExist } from "../utils/index.js";

const schemaGraphQLContent = `# Replace this with your own GraphQL schema file!${EOL}type Query {${EOL}  field: String${EOL}}${EOL}`;

export class GenerateGraphQlSchemaFileTask extends TaskBase {
  constructor(private settings: ProjectSettings) {
    super();
  }

  async run(): Promise<void> {
    if (doesExist(this.settings.schemaFile)) {
      this.skip("File exists");
    }

    const dir = path.dirname(this.settings.schemaFile);

    // todo: handle error
    createDirectory(dir);

    // todo: handle error
    await writeToFile(this.settings.schemaFile, schemaGraphQLContent);
  }
}
