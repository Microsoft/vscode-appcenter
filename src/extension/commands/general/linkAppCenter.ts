import * as path from "path";
import { Utils } from "../../../helpers/utils/utils";
import { VsCodeUtils } from "../../../helpers/utils/vsCodeUtils";
import AppCenterLinker from "../../../link/appCenterLinker";
import { Strings } from "../../resources/strings";
import { LinkCommand } from "../linkCommand";
import AppCenterConfig from "../../../data/appCenterConfig";
import { Constants, AppCenterOS } from "../../resources/constants";

export default class LinkAppCenter extends LinkCommand {

    public async run(): Promise<void> {
        if (!await super.run()) {
            return;
        }

        if (!Utils.isReactNativeProject(this.logger, this.rootPath, false)) {
            VsCodeUtils.ShowWarningMessage(Strings.NotReactProjectMsg);
            return;
        }

        this.showAppsQuickPick(this.CachedAllApps, false, true, false, Strings.ProvideSecondAppPromptMsg);
        this.refreshCachedAppsAndRepaintQuickPickIfNeeded(true, false, false, Strings.ProvideFirstAppPromptMsg);
    }

    protected async linkApps(): Promise<boolean> {
        const appCenterLinker: AppCenterLinker = new AppCenterLinker(this.logger, this.rootPath);

        if (!Utils.isReactNativeAppCenterProject(this.logger, this.rootPath, false)) {
            const appCenterInstalled: boolean = await appCenterLinker.installAppcenter();
            if (!appCenterInstalled) {
                VsCodeUtils.ShowErrorMessage(Strings.FailedToLinkAppCenter);
                return void 0;
            }
        }

        this.removeAppSecretKeys();

        return await appCenterLinker.linkAppCenter(this.pickedApps);
    }

    private removeAppSecretKeys() {
        const appName: string = Utils.getAppName(this.rootPath);

        const pathToAppCenterConfigPlist: string = path.join(this.rootPath, "ios", appName, "AppCenter-Config.plist");
        const pathToMainPlist: string = path.join(this.rootPath, "ios", appName, "Info.plist");
        const pathToAndroidConfig: string = path.join(this.rootPath, "android", "app", "src", "main", "assets", "appcenter-config.json");
        const pathToAndroidStringResources: string = path.join(this.rootPath, "android", "app", "src", "main", "res", "values", "strings.xml");
        const appCenterConfig = new AppCenterConfig(pathToAppCenterConfigPlist, pathToMainPlist, pathToAndroidConfig, pathToAndroidStringResources, this.logger);

        const hasAndroidApps: boolean = this.pickedApps.some(app => {
            return app.os.toLowerCase() === AppCenterOS.Android.toLowerCase();
        });

        const hasiOSApps: boolean = this.pickedApps.some(app => {
            return app.os.toLowerCase() === AppCenterOS.iOS.toLowerCase();
        });

        if (hasiOSApps) {
            appCenterConfig.deleteConfigPlistValueByKey(Constants.IOSAppSecretKey);
            appCenterConfig.saveConfigPlist();
        }

        if (hasAndroidApps) {
            appCenterConfig.deleteAndroidAppCenterConfigValueByKey(Constants.AndroidAppSecretKey);
            appCenterConfig.saveAndroidAppCenterConfig();
        }
    }

}
