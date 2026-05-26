import {Module} from "./Module";
import {CacheManager, SimpleMutex} from "@spatulox/utils";

/**
 * cacheKey : The name of the file where the cache is going to be
 * cacheData : The data of the cache, should be initialized empty or with default value
 */
export abstract class ModuleWithStaticCache extends Module {

    static cacheKey: string
    static cacheData: any

    private static writeMutex: SimpleMutex = new SimpleMutex()

    private static assertOverridden() {
        if (!this.cacheKey) {
            throw new Error(`[${this.name}] must override static 'cacheKey'`)
        }
        if (this.cacheData === undefined) {
            throw new Error(`[${this.name}] must override static 'cacheData'`)
        }
    }

    static async loadCache(): Promise<typeof this.cacheData | false> {
        this.assertOverridden()
        return await CacheManager.getOrCreateCache<typeof this.cacheData>(this.cacheKey, this.cacheData)

    }

    static async syncCache(cacheData: typeof this.cacheData) : Promise<void>{
        try{
            this.assertOverridden()
            this.cacheData = cacheData
            await this.writeCache()
            await this.loadCache()
        } catch(error){
            console.log(error)
        }
    }

    static getKey(): string{
        return this.cacheKey
    }

    static getCache(): string{
        return this.cacheData
    }

    static async readCache(){
        this.assertOverridden()
        return await CacheManager.readCache(this.cacheKey)
    }

    static async writeCache(){
        try {
            await ModuleWithStaticCache.writeMutex.lock()
            await CacheManager.writeCache(this.cacheKey, this.cacheData);
        } catch(error){
            console.log(error)
        } finally {
            ModuleWithStaticCache.writeMutex.unlock()
        }
    }
}