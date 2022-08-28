import { TaskBase } from "./TaskBase.js";
import { h } from "../utils/index.js";
import { ProjectContext } from "../misc/ProjectContext.js";

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
    this.updateMessage(this.message + " " + h(this.context.schemaPath.rel));

    if (this.context.fs.exists(this.context.schemaPath.abs)) {
      this.skip("File exists");
      return;
    }

    // todo: handle error
    await this.context.fs.createDirectory(
      this.context.schemaPath.parentDirectory
    );

    // todo: handle error
    await this.context.fs.writeToFile(
      this.context.schemaPath.abs,
      schemaGraphQLContent
    );
  }
}
