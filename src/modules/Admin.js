import Module from "./abstract/Module.js";

export default class ExampleModule extends Module {
    name = "Admin";

    onEnable() {
        this.logger.info("Enabled");
    }
}