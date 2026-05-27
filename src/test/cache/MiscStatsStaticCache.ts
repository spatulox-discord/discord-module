import {ModuleWithStaticCache} from "../../code/modules/ModuleWithStaticCache";
import {CacheManager} from "@spatulox/utils";
import {ModuleEventsMap} from "../../code/Module";

interface MiscStatisticsCache {
    auto_ban_count: number
}

export class MiscStatsStaticCache extends ModuleWithStaticCache {
    name: string = "Misc Statistics";
    description: string = "Statistics with Static Cache";

    static override cacheKey: string = "misc_stats"
    static override cacheData: MiscStatisticsCache = {auto_ban_count: 0}

    get events(): ModuleEventsMap {
        return {}
    }

    constructor() {
        super();
        this.init()
    }

    private async init(): Promise<void> {
        (await MiscStatsStaticCache.loadCache())
        console.log(await CacheManager.getOrCreateCache(MiscStatsStaticCache.cacheKey, MiscStatsStaticCache.cacheData))
        console.log(MiscStatsStaticCache.cacheData);
    }

    static get cache(): MiscStatisticsCache {
        return MiscStatsStaticCache.cacheData;
    }

    static async incrementAutoBanScam(){
        try {
            this.cacheData.auto_ban_count = this.cacheData.auto_ban_count + 1;
            await this.writeCache();
        } catch (e) {console.log(e)}
    }
}