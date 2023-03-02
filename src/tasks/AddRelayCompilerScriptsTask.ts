import { TaskBase } from "./TaskBase.js";
import { PACKAGE_FILE } from "../consts.js";
import { bold } from "../utils/cli.js";
import { ProjectContext } from "../misc/ProjectContext.js";
import { execSync } from "child_process";

const validateRelayArtifactsScript = "relay-compiler --validate";

export class AddRelayCompilerScriptsTask extends TaskBase {
    message: string = `Add ${bold("relay-compiler")} scripts`;

    constructor(private context: ProjectContext) {
        super();
    }

    isEnabled(): boolean {
        return true;
    }

    async run(): Promise<void> {
        this.updateMessage(this.message + ` in ${bold(this.context.ownPackageJsonFile.rel)}`)

        const packageJson = await this.context.env.packageJson.parse();

        const scriptsSection: Record<string, string> = packageJson["scripts"] ?? {};

        if (!scriptsSection["relay"]) {
            const watchmanInstalled = isWatchmanInstalled();

            // Add "relay" script
            scriptsSection["relay"] = "relay-compiler";

            if (watchmanInstalled) {
                scriptsSection["relay"] += " --watch";
            }
        }

        const buildScript = scriptsSection["build"];

        if (buildScript && typeof buildScript === "string" && !buildScript.includes(validateRelayArtifactsScript)) {
            // Validate Relay's artifacts as the first build step.
            scriptsSection["build"] = validateRelayArtifactsScript + " && " + buildScript;
        }

        this.context.env.packageJson.persist(packageJson);
    }
}

function isWatchmanInstalled() {
    try {
        execSync("watchman", { stdio: "ignore" });

        return true
    } catch {
        return false
    }
}