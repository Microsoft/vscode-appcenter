import { execSync } from 'child_process';
import * as fs from 'fs';
import * as open from 'open';
import * as opener from 'opener';
import * as os from 'os';
import * as path from 'path';
import { AppCenterOS, Constants } from '../constants';
import { ILogger } from '../log/logHelper';
import { Strings } from '../strings';
import { cpUtils, SpawnError } from './cpUtils';
import { CurrentApp, CurrentAppDeployments } from './interfaces';
import { Validators } from './validators';

export class Utils {
    public static FormatMessage(message: string): string {
        if (message) {
            //Replace newlines with spaces
            return message.replace(/\r\n/g, " ").replace(/\n/g, " ").trim();
        }
        return message;
    }

    public static FormatAppName(name: string): string {
        const ELLIPSIZE_LENGTH_WO_HINT = 15;
        const ELLIPSIZE_LENGTH_WITH_HINT = 10;
        if (name.length < ELLIPSIZE_LENGTH_WO_HINT) {
            return name;
        }
        let hint: string = "";
        if (name.endsWith("-ios")) {
            hint = " (iOS)";
        } else if (name.endsWith("-android")) {
            hint = " (android)";
        }
        return name.substr(0, hint.length ? ELLIPSIZE_LENGTH_WITH_HINT : ELLIPSIZE_LENGTH_WO_HINT) + "..." + hint;
    }

    public static Delay<T>(millis: number, value?: T): Promise<T> {
        return new Promise((resolve) => setTimeout(() => resolve(value), millis));
    }

    //Use open for Windows and Mac, opener for Linux
    public static OpenUrl(url: string): void {
        switch (process.platform) {
            case "win32":
            case "darwin":
                open(url);
                break;
            default:
                opener(url);
                break;
        }
    }

    public static getYarnVersionIfAvailable(): string | null {
        let yarnVersion: string | null = null;
        try {
            // execSync returns a Buffer -> convert to string
            if (process.platform.startsWith('win')) {
                yarnVersion = (execSync('yarn --version 2> NUL').toString() || '').trim();
            } else {
                yarnVersion = (execSync('yarn --version 2>/dev/null').toString() || '').trim();
            }
        } catch (error) {
            return null;
        }
        return yarnVersion;
    }

    public static parseJsonFile(path: string, installHint?: string) {
        let fileContents;
        try {
            fileContents = fs.readFileSync(path, 'utf8');
        } catch (err) {
            if (installHint) {
                installHint = ` ${installHint}`;
            }
            throw new Error(`Cannot find "${path}".${installHint}`);
        }
        try {
            return JSON.parse(fileContents);
        } catch (err) {
            throw new Error(`Cannot parse "${path}": ${err.message}`);
        }
    }

    public static projectHaveNpmPackage(logger: ILogger, projectRoot: string | undefined, packageName: string, installHint: string, showMessageOnError?: boolean): boolean {
        if (!projectRoot) {
            return false;
        }

        const packageJsonPath = path.resolve(
            projectRoot, 'node_modules', packageName, 'package.json'
        );

        try {
            Utils.parseJsonFile(packageJsonPath, installHint);
        } catch (e) {
            if (showMessageOnError) {
                logger.error(e.message);
            }
            return false;
        }

        return true;
    }

    public static isReactNativeProject(logger: ILogger, projectRoot: string | undefined, showMessageOnError?: boolean) {
        return Utils.projectHaveNpmPackage(logger, projectRoot, 'react-native', Strings.ReactNativeInstallHint, showMessageOnError);
    }

    public static isReactNativeCodePushProject(logger: ILogger, projectRoot: string | undefined, showMessageOnError?: boolean) {
        return Utils.projectHaveNpmPackage(logger, projectRoot, 'react-native-code-push', Strings.CodePushInstallHint, showMessageOnError);
    }

    public static isReactNativeAppCenterProject(logger: ILogger, projectRoot: string | undefined, showMessageOnError?: boolean) {
        return Utils.projectHaveNpmPackage(logger, projectRoot, 'appcenter', Strings.AppCenterInstallHint, showMessageOnError);
    }

    public static toAppCenterOS(codePushOs: string): AppCenterOS | undefined {
        switch (codePushOs.toLowerCase()) {
            case 'android':
                return AppCenterOS.Android;
            case 'ios':
                return AppCenterOS.iOS;
            case 'windows':
                return AppCenterOS.Windows;
            default:
                throw new Error('Unknown App Center OS');
        }
    }

    public static toCurrentApp(app: string,
        appOS: AppCenterOS,
        appDeployment: CurrentAppDeployments | null,
        targetBinaryVersion: string,
        type: string,
        isMandatory: boolean,
        appSecret: string): CurrentApp | null {
        const matches = app.match(Validators.ValidAppCenterAppName);
        if (matches !== null) {
            return {
                ownerName: matches[1],
                appName: matches[2],
                identifier: `${matches[1]}/${matches[2]}`,
                os: appOS,
                targetBinaryVersion: targetBinaryVersion,
                isMandatory: isMandatory,
                type: type,
                appSecret: appSecret,
                currentAppDeployments: appDeployment ? appDeployment : {
                    codePushDeployments: [],
                    currentDeploymentName: ""
                }
            };
        }
        return null;
    }

    public static getUserDir(): string {
        //todo move to constants
        if (os.platform() === "win32") {
            return process.env.AppData;
        } else {
            return os.homedir();
        }
    }

    public static getAppCenterProfileFileName() {
        return path.join(Utils.getUserDir(), Constants.ProfileDir, Constants.AppCenterProfileFileName);
    }

    public static getVstsProfileFileName() {
        return path.join(Utils.getUserDir(), Constants.ProfileDir, Constants.VstsProfileFileName);
    }

    public static getAppCenterTokensFileName() {
        return path.join(Utils.getUserDir(), Constants.TokenDir, Constants.AppCenterTokenFileName);
    }

    public static getAppName(projectRoot: string) {
        const packageJsonPath = path.resolve(
            projectRoot, 'package.json'
        );

        const packageJson = Utils.parseJsonFile(packageJsonPath);
        return packageJson.name;
    }

    public static async packageInstalledGlobally(packageName: string) {
        const resultSignalsThatPackageInstalled = (result) => !/\(empty\)/.test(result);
        let result: string = "";
        try {
            result = await cpUtils.executeCommand(undefined, true, undefined, "npm", [], ...["list", "--depth", "1", "-g", packageName]);
        } catch (e) {
            if (e instanceof SpawnError) {
                if (e.exitCode === 1 && e.result && !resultSignalsThatPackageInstalled(e.result)) {
                    return false;
                }
                throw e;
            }
        }
        return resultSignalsThatPackageInstalled(result);
    }
}
