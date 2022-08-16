import { TaskBase } from "./TaskBase.js";
import { createDirectory, writeToFile, doesExist, h } from "../utils/index.js";
import { ProjectContext } from "../ProjectContext.js";

const schemaGraphQLContent = `# Replace this with your own GraphQL schema file!
type Query {
  field: String
}`;

export class GenerateGraphQlSchemaFileTask extends TaskBase {
  message: string = "Generate GraphQL schema file";

  constructor(private context: ProjectContext) {
    super();
  }

  isEnabled(): boolean {
    return true;
  }

  async run(): Promise<void> {
    this.updateMessage(this.message + " " + h(this.context.schemaFile.rel));

    if (doesExist(this.context.schemaFile.abs)) {
      this.skip("File exists");
      return;
    }

    // todo: handle error
    createDirectory(this.context.schemaFile.parentDirectory);

    // todo: handle error
    await writeToFile(this.context.schemaFile.abs, schemaGraphQLContent);
  }
}
