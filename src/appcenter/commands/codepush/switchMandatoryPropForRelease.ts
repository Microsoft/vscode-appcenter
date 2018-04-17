import { AppCenterOS } from "../../../constants";
import { CommandParams, CurrentApp } from "../../../helpers/interfaces";
import { VsCodeUtils } from "../../../helpers/vsCodeUtils";
import { Strings } from "../../../strings";
import { RNCPAppCommand } from "./rncpAppCommand";

export default class SwitchMandatoryPropForRelease extends RNCPAppCommand {
    constructor(params: CommandParams) {
        super(params);
    }

    public async runNoClient(): Promise<void> {
        if (!await super.runNoClient()) {
            return;
        }

        this.getCurrentApp().then((app: CurrentApp) => {
            if (!app) {
                VsCodeUtils.ShowInfoMessage(Strings.NoCurrentAppSetMsg);
                return;
            }
            const newMandatoryValue = !!!app.isMandatory;
            this.saveCurrentApp(
                app.identifier,
                AppCenterOS[app.os],
                {
                    currentDeploymentName: app.currentAppDeployments.currentDeploymentName,
                    codePushDeployments: app.currentAppDeployments.codePushDeployments
                },
                app.targetBinaryVersion,
                app.type,
                newMandatoryValue,
                app.appSecret
            ).then(() => {
                VsCodeUtils.ShowInfoMessage(`Changed release to ${newMandatoryValue ? "Mandatory" : "NOT Mandatory"}`);
            });
        });
    }
}
