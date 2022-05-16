import Module from "./abstract/Module.js";

export default class ExampleModule extends Module {
    name = "Module McModuleface";

    onEnable() {
        this.logger.info("aaaaaaaa");
    }
}