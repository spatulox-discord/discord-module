import {ModuleManager} from "./ModuleManager";
import {Module} from "./Module";

/**
 * This class is present only to avoid circular dependencies with the "module instance nightmare"
 * Idk why I can't directly ue the Manager.getInstance?.getMdule(this.name) dans Module, but I can't and need to do thing like that ?
 */
export class ModuleRegistry {
    private static _manager: ModuleManager | null = null;

    static setModuleManager(m: ModuleManager) {
        ModuleRegistry._manager = m;
    }

    static getModule(name: string): Module | undefined {
        return this._manager?.getModule(name);
    }

    static get manager() : ModuleManager | null {
        return this._manager;
    }
}