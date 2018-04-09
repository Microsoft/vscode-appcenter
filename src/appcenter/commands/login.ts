import * as os from 'os';
import * as qs from 'qs';
import * as vscode from 'vscode';
import { AppCenterAppsCache } from '../../cache/appsCache';
import { AppCenterCache } from '../../cache/baseCache';
import { AppCenterController } from '../../controller/appCenterController';
import { ExtensionManager } from '../../extensionManager';
import { AppCenterAppsLoader } from '../../helpers/appsLoader';
import { Profile } from '../../helpers/interfaces';
import { SettingsHelper } from '../../helpers/settingsHelper';
import { IButtonMessageItem, VsCodeUtils } from '../../helpers/vsCodeUtils';
import { ILogger } from '../../log/logHelper';
import { Strings } from '../../strings';
import { createAppCenterClient, models } from '../api';
import { Command } from './command';

export default class Login extends Command {

    constructor(manager: ExtensionManager, logger: ILogger) {
        super(manager, logger);
    }

    public async runNoClient(): Promise<boolean | void> {
        if (! await super.runNoClient()) {
            return false;
        }

        const messageItems: IButtonMessageItem[] = [];
        const loginUrl = `${SettingsHelper.getAppCenterLoginEndpoint()}?${qs.stringify({ hostname: os.hostname() })}`;
        messageItems.push({
            title: Strings.OkBtnLabel,
            url: loginUrl
        });

        return VsCodeUtils.ShowInfoMessage(Strings.PleaseLoginViaBrowser, ...messageItems)
            .then((selection: IButtonMessageItem | undefined) => {
                if (selection) {
                    return vscode.window.showInputBox({ prompt: Strings.PleaseProvideToken, ignoreFocusOut: true })
                        .then(token => {
                            this.loginWithToken(token);
                        });
                } else { return; }
            });
    }

    private async loginWithToken(token: string | undefined): Promise<boolean> {
        if (!token) {
            this.logger.info("No token provided on login");
            return true;
        }

        return this.manager.auth.doTokenLogin(token).then((profile: Profile) => {
            if (!profile) {
                this.logger.error("Failed to fetch user info from server");
                VsCodeUtils.ShowWarningMessage(Strings.FailedToExecuteLoginMsg);
                return false;
            }

            const client = createAppCenterClient().fromProfile(profile, SettingsHelper.getAppCenterAPIEndpoint());
            if (client) {
                const appsLoader = new AppCenterAppsLoader(client);
                const appsCache: AppCenterCache<models.AppResponse[]> = AppCenterAppsCache.getInstance();
                const controller = new AppCenterController(profile, appsLoader, appsCache);
                controller.load(true);
            }

            VsCodeUtils.ShowInfoMessage(Strings.YouAreLoggedInMsg(profile.displayName));
            return this.manager.setupAppCenterStatusBar(profile).then(() => true);
        }).catch((e: Error) => {
            VsCodeUtils.ShowErrorMessage("Could not login into account.");
            this.logger.error(e.message, e, true);
            return false;
        });
    }
}
