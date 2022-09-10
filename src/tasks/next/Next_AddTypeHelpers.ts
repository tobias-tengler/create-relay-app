import path from "path";
import { NEXT_SRC_PATH } from "../../consts.js";
import { ProjectContext } from "../../misc/ProjectContext.js";
import { RelativePath } from "../../misc/RelativePath.js";
import { prettifyCode } from "../../utils/ast.js";
import { h } from "../../utils/cli.js";
import { TaskBase } from "../TaskBase.js";

const code = `
import type { GetServerSideProps } from "next";
import type { RecordMap } from "relay-runtime/lib/store/RelayStoreTypes";

export type RelayPageProps = {
  initialRecords?: RecordMap;
};

export type RelayServerSideProps<TProps extends object = {}> =
  GetServerSideProps<TProps & Required<RelayPageProps>>;
`;

export class Next_AddTypeHelpers extends TaskBase {
  message = "Add type helpers";

  constructor(private context: ProjectContext) {
    super();
  }

  isEnabled(): boolean {
    return this.context.is("next") && this.context.args.typescript;
  }

  async run(): Promise<void> {
    const filepath = this.getRelayTypesPath();

    this.updateMessage(this.message + " " + h(filepath.rel));

    const prettifiedCode = prettifyCode(code);

    await this.context.fs.writeToFile(filepath.abs, prettifiedCode);
  }

  private getRelayTypesPath(): RelativePath {
    const filepath = path.join(NEXT_SRC_PATH, "relay-types.ts");
    return this.context.env.rel(filepath);
  }
}
