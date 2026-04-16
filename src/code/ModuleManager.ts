import {
    Client,
    //Events
} from "discord.js";
import {Module} from './Module';
import {MultiModule} from "./MultiModule";
import {ModuleRegistry} from "./ModuleRegistry";

export type ModuleMap = Record<string, Module[]>

export class ModuleManager {
    private _modules: ModuleMap = {};
    private client: Client | null;
    private static instance: ModuleManager | null;

    private constructor(client: Client) {
        this.client = client;
    }

    private static createInstance(client: Client): ModuleManager {
        ModuleManager.instance = new ModuleManager(client);
        ModuleRegistry.setModuleManager(ModuleManager.instance);
        return ModuleManager.instance;
    }

    public static createOrGetInstance(client: Client): ModuleManager {
        if(this.instance) {
            return this.instance;
        }
        return this.createInstance(client);
    }

    public static getInstance(): ModuleManager | null {
        return ModuleManager.instance;
    }

    get modules(): ModuleMap { return this._modules; }
    static get modules(): ModuleMap | undefined { return ModuleManager.getInstance()?._modules }

    register(module: Module | MultiModule): void {

        if(this.getModule(module.name)) {
            throw new Error(`Duplicate Module name : '${module.name}' already exist`);
        }

        if(module instanceof MultiModule) {
            this.registerMod(module);
            for (const mod of module.subModules) {
                mod.setParent(module.name)
                if(mod instanceof MultiModule) {
                    this.register(mod)
                    continue
                }
                this.registerMod(mod);
            }
            return
        }
        this.registerMod(module);
    }

    private registerMod(module: Module): void {
        if (!this._modules[module.parent]) {
            this._modules[module.parent] = [];
        }
        this._modules[module.parent]!.push(module);
        this.bindEvents(module);
    }

    private bindEvents(module: Module) {
        const eventsMap = module.events;

        for (const [eventName, method] of Object.entries(eventsMap)) {
            // ✅ Automatic Binding
            if (typeof method === 'function') {
                this.client?.on(eventName, async (...args: any[]) => {
                    if (module.enabled) {
                        await method(...args);
                    }
                });
            } else if (Array.isArray(method)) {
                // Tableau de fonctions
                for (const handler of method) {
                    if (typeof handler === 'function') {
                        this.client?.on(eventName, async (...args: any[]) => {
                            if (module.enabled) {
                                await handler(...args);
                            }
                        });
                    }
                }
            }
        }
    }

    enableAll() {
        Object.values(this._modules).forEach(modules =>
            modules.forEach(mod => mod.enable())
        );
    }

    disableAll() {
        Object.values(this._modules).forEach(modules =>
            modules.forEach(mod => mod.disable())
        );
    }

    getRoot(): Module[] | undefined {
        return this._modules["root"]
    }

    getModule(name: string): Module | undefined {
        for (const parentModules of Object.values(this._modules)) {
            const found = parentModules.find(m => m.name.toLowerCase() === name.toLowerCase());
            if (found) return found;
        }
    }

    get enabledCount(): number {
        return Object.values(this._modules).flat().filter(m => m.enabled).length;
    }

}