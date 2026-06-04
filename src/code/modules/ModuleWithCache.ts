import {Module} from "../Module";
import {CacheManager, SimpleMutex} from "@spatulox/utils";

/**
 * cacheKey : The name of the file where the cache is going to be
 * cacheData : The data of the cache, should be initialized empty or with default value
 */
export abstract class ModuleWithCache<TCache> extends Module {

    protected abstract cacheKey: string
    protected abstract cacheData: TCache
    protected abstract initData(): TCache

    private static writeMutex: SimpleMutex = new SimpleMutex()

    protected async loadCache() {
        const cache = await CacheManager.getOrCreateCache<TCache>(this.cacheKey, this.initData())
        if(cache){
            this.cacheData = cache
        }
    }

    protected async syncCache(cacheData: TCache) : Promise<void> {
        this.cacheData = cacheData
        await this.writeCache()
        await this.loadCache()
    }

    get key(): string {
        return this.cacheKey;
    }
    get cache(){
        return this.cacheData;
    }

    protected async writeCache(){
        try {
            await ModuleWithCache.writeMutex.lock()
            await CacheManager.writeCache(this.cacheKey, this.cacheData);
        } catch(error){
            console.log(error);
        } finally {
            ModuleWithCache.writeMutex.unlock()
        }
    }

    protected async readCache(){
        const cache = await CacheManager.readCache<TCache>(this.cacheKey);
        if(cache){
            this.cacheData = cache
        }
    }





    static async initCache(cacheKey: string, cacheData: object): Promise<typeof cacheData | false> {
        return await CacheManager.getOrCreateCache<typeof cacheData>(cacheKey, cacheData)

    }
    static async readCache(cacheKey: string){
        return await CacheManager.readCache(cacheKey)
    }
    static async writeCache(cacheKey: string, cacheData: object): Promise<boolean> {
        return await CacheManager.writeCache(cacheKey, cacheData);
    }
}