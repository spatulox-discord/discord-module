import {ModuleEventsMap} from "../../code/Module";
import {ModuleWithStaticCache} from "../../code/ModuleWithStaticCache";

interface cache {
    test: number
}

export class StaticCache extends ModuleWithStaticCache {
    public name: string = "Static Cache";
    public description: string = "Example Module with Static Cache"
    public get events(): ModuleEventsMap {
        return {}
    }

    static override cacheKey: string = "static-cache"
    static override cacheData: cache = {test: 0}

    constructor() {
        super();
        StaticCache.loadCache()
    }

}