import {ModuleEventsMap} from "../../code/Module";
import {ModuleWithCache} from "../../code/ModuleWithCache";

interface cache {
    test: number
}

export class InstanceCache extends ModuleWithCache<cache> {
    public name: string = "Instance Cache";
    public description: string = "Example Module with Static Cache"
    public get events(): ModuleEventsMap {
        return {}
    }

    cacheKey: string = ""
    cacheData: cache = {test: 0}

    constructor() {
        super();
    }

}