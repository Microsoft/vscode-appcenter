import { AppCenterOS } from "../constants";

export interface Deployment {
    name: string;
    key?: string;
    os?: AppCenterOS;
}

export interface CurrentAppDeployments {
    currentDeploymentName: string;
    codePushDeployments: Deployment[];
}

export interface UserOrOrganizationItem {
    isOrganization: boolean;
    name?: string;
    displayName?: string;
}

export interface CurrentApp {
    ownerName: string;
    appName: string;
    identifier: string;
    targetBinaryVersion: string;
    isMandatory: boolean;
    os: string;
    type: string;
    currentAppDeployments: CurrentAppDeployments;
}

export interface CreatedAppFromAppCenter {
    appSecret: string;
    platform: string;
    os: string;
    name: string;
}

export interface Profile {
    userId: string;
    userName: string;
    displayName: string;
    email: string;
    readonly accessToken: Promise<string>;
    currentApp?: CurrentApp;
    save(): Profile;
    logout(): Promise<void>;
}

export interface IDefaultCommandParams {
    app: CurrentApp;
}
export interface ICodePushReleaseParams extends IDefaultCommandParams {
  deploymentName: string;
  updatedContentZipPath: string;
  appVersion?: string;
  description?: string;
  isDisabled?: boolean;
  isMandatory?: boolean;
  label?: string;
  packageHash?: string;
  rollout?: number;
  token?: string;
}

export interface QuickPickAppItem {
    label: string;
    description: string;
    target: string;
}

export interface AppCenterView<T> {
    display(items: T[]);
    showProgress(title: string, fnc: () => Promise<any>): Thenable<void>;
}

export interface AppCenterLoader<T> {
    load(): Promise<T[]>;
}

export interface AppCenterCache<T> {
    invalidateCache();
    set(key: string, value: T);
    get(key: string): Promise<T | null>;
    cacheDiffersFrom(key: string, items: T): Promise<boolean>;
}

