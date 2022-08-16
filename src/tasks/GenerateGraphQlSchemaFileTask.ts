import path from "path";
import { TaskBase } from "./TaskBase.js";
import { ProjectSettings } from "../types.js";
import { createDirectory, writeToFile, doesExist } from "../utils/index.js";

const schemaGraphQLContent = `# Replace this with your own GraphQL schema file!
type Query {
  field: String
}`;

export class GenerateGraphQlSchemaFileTask extends TaskBase {
  message: string = "Generate GraphQL schema file";

  constructor(private settings: ProjectSettings) {
    super();
  }

  isEnabled(): boolean {
    return true;
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
