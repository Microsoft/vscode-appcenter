import { AppCenterClient, models } from "../../appcenter/api";
import { Constants } from "../../constants";
import { AppCenterCache } from "./cache";

export class AppCenterAppsCache extends AppCenterCache<models.AppResponse, AppCenterClient> {

    private static instance: AppCenterAppsCache;

    public static getInstance(): AppCenterAppsCache {
        if (!this.instance) {
            this.instance = new AppCenterAppsCache();
        }
        return this.instance;
    }

    protected async loadItems(loader: AppCenterClient): Promise<models.AppResponse[]> {
        return loader.account.apps.list({
            orderBy: "name"
        }).then((apps: models.AppResponse[]) => {
            return apps.filter(app => app.platform === Constants.AppCenterReactNativePlatformName);
        });
    }

    protected compareItems(cachedApp: models.AppResponse, app: models.AppResponse): boolean {
        return cachedApp.id === app.id;
    }
}
