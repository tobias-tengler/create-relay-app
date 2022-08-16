import { TaskBase } from "./TaskBase.js";
import { ProjectSettings } from "../types.js";
import { createDirectory, writeToFile, doesExist, h } from "../utils/index.js";

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
    this.updateMessage(this.message + " " + h(this.settings.schemaFile.rel));

    if (doesExist(this.settings.schemaFile.abs)) {
      this.skip("File exists");
      return;
    }

    // todo: handle error
    createDirectory(this.settings.schemaFile.parentDirectory);

    // todo: handle error
    await writeToFile(this.settings.schemaFile.abs, schemaGraphQLContent);
  }
}
