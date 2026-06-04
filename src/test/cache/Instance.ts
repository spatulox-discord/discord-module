import {ModuleEventsMap} from "../../code/Module";
import {ModuleWithCache} from "../../code/modules/ModuleWithCache";
import {CacheManager} from "@spatulox/utils";

interface cache {
    test: number
}

export class InstanceCache extends ModuleWithCache<cache> {
    protected initData(): cache {
        return {test: 0}
    }
    name: string = "Instance Cache";
    description: string = "Statistics with Static Cache";

    cacheKey: string = "instance_cache"
    cacheData: cache = {test: 0}

    get events(): ModuleEventsMap {
        return {}
    }

    constructor() {
        super();
        this.init()
    }

    private async init(): Promise<void> {
        await this.loadCache()
        console.log(await CacheManager.readCache(this.cacheKey))
        console.log(this.cacheData)
    }
}