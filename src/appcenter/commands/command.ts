import { ExtensionManager } from "../../extensionManager";
import { Profile, DefaultApp, CurrentAppDeployments } from "../../helpers/interfaces";
import { SettingsHelper } from "../../helpers/settingsHelper";
import { Strings } from "../../helpers/strings";
import { VsCodeUtils } from "../../helpers/vsCodeUtils";
import { ILogger, LogLevel } from "../../log/logHelper";
import { AppCenterClient, AppCenterClientFactory, createAppCenterClient } from "../api";
import Auth from "../auth/auth";
import { AppCenterOS } from "../../helpers/constants";
import { Utils } from "../../helpers/utils";
import { ProjectRootNotFoundError } from '../../helpers/errors';

export class Command {

    protected clientFactory: AppCenterClientFactory;
    protected client: AppCenterClient;

    constructor(protected manager: ExtensionManager, protected logger: ILogger) {
        this.clientFactory = createAppCenterClient();
    }

    public get Profile(): Promise<Profile | null> {
        return Auth.getProfile(<string>this.manager.projectRootPath).then((profile: Profile) => {
            if (!profile) {
                this.logger.log(`No profile found within "${this.manager.projectRootPath}" path`, LogLevel.Info);
                return null;
            }
            return profile;
        });
    }

    public runNoClient(): Promise<boolean | void> {
        const rootPath: string | undefined = this.manager.projectRootPath;
        if (!rootPath) {
            const error = new ProjectRootNotFoundError();
            this.logger.log(error.message, LogLevel.Error);
            return Promise.resolve(false);
        }
        return Promise.resolve(true);
    }

    public async run(): Promise<boolean | void> {
        const rootPath: string | undefined = this.manager.projectRootPath;
        if (!rootPath) {
            this.logger.log('No project root path found.', LogLevel.Error);
            return Promise.resolve(false);
        }

        const profile = await this.Profile;
        if (!profile) {
            VsCodeUtils.ShowWarningMessage(Strings.UserIsNotLoggedInMsg);
            return Promise.resolve(false);
        } else {
            const clientOrNull: AppCenterClient | null = this.resolveAppCenterClient(profile);
            if (clientOrNull) {
                this.client = clientOrNull;
            } else {
                this.logger.log("Failed to get App Center client", LogLevel.Error);
                return Promise.resolve(false);
            }
            return Promise.resolve(true);
        }
    }

    private resolveAppCenterClient(profile: Profile): AppCenterClient | null {
        if (!this.client) {
            if (profile) {
                return this.clientFactory.fromProfile(profile, SettingsHelper.getAppCenterAPIEndpoint());
            } else {
                this.logger.log('No App Center user specified!', LogLevel.Error);
                return null;
            }
        }
        return this.client;
    }

    protected getDefaultApp(): Promise<DefaultApp | null> {
        return this.Profile.then((profile: Profile | null) => {
            if (profile && profile.defaultApp) {
                return profile.defaultApp;
            }
            return null;
        });
    }

    protected saveCurrentApp(
        projectRootPath: string,
        currentAppName: string,
        appOS: AppCenterOS,
        currentAppDeployments: CurrentAppDeployments | null,
        targetBinaryVersion: string,
        isMandatory: boolean): Promise<DefaultApp | null> {
        const defaultApp = Utils.toDefaultApp(currentAppName, appOS, currentAppDeployments, targetBinaryVersion, isMandatory);
        if (!defaultApp) {
            VsCodeUtils.ShowWarningMessage(Strings.InvalidCurrentAppNameMsg);
            return Promise.resolve(null);
        }

        return this.Profile.then((profile: Profile | null) => {
            if (profile) {
                profile.defaultApp = defaultApp;
                profile.save(projectRootPath);
                return Promise.resolve(defaultApp);
            } else {
                // No profile - not logged in?
                VsCodeUtils.ShowWarningMessage(Strings.UserIsNotLoggedInMsg);
                return Promise.resolve(null);
            }
        });
    }
}
