import {Module, ModuleEventsMap} from "../../code/Module";
import {MultiModule} from "../../code/modules/MultiModule";
import {RandomModule8} from "./RandomModule8";
import {RandomModule9} from "./RandomModule9";
import {RandomModule10} from "./RandomModule10";

export class RandomModule7 extends MultiModule {
    public name: string = "Random7";
    public description: string = "Raomdom";
    public get events(): ModuleEventsMap {
        return {}
    }

    public subModules: Module[] = [
        new RandomModule8(),
        new RandomModule9(),
        new RandomModule10(),
    ]
}