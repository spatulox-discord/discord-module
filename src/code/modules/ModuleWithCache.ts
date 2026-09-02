import {Module} from "../Module";
import {CacheManager, SimpleMutex} from "@spatulox/utils";
import {mergeWithDefault} from "./cacheMerge";

/**
 * cacheKey : The name of the file where the cache is going to be
 * cacheData : The data of the cache, should be initialized empty or with default value
 */
export abstract class ModuleWithCache<TCache> extends Module {

    protected abstract cacheKey: string
    protected cacheData: TCache = this.initData()
    protected abstract initData(): TCache

    private static writeMutex: SimpleMutex = new SimpleMutex()

    /**
     * initData() is called again here, and not only in the property initializer above, because
     * that initializer runs inside the base constructor : the subclass fields and constructor
     * body are not assigned yet, so anything initData() reads from the instance is undefined.
     *
     * The stored cache is then merged over those default values, so a cache file written by an
     * older version (or missing a key for any other reason) keeps a usable default instead of
     * an undefined value.
     */
    protected async loadCache() {
        const defaultData = this.initData()
        const cache = await CacheManager.getOrCreateCache<TCache>(this.cacheKey, defaultData)
        this.cacheData = cache ? mergeWithDefault(defaultData, cache) : defaultData
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