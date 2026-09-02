/**
 * Internal helper shared by ModuleWithCache and ModuleWithStaticCache.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * Merge a cache read from the disk over the default data returned by initData().
 *
 * A cache file written by an older version of the module (or by a version which stored an
 * undefined value, since JSON.stringify simply drops those keys) does not contain every key
 * the module expects. Without this merge, those keys silently become undefined.
 */
export function mergeWithDefault<T>(defaultData: T, cache: T): T {
    if(isPlainObject(defaultData) && isPlainObject(cache)){
        return {...defaultData, ...cache} as T
    }
    return cache
}
