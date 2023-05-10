import colors from "colors";

export default class Logger {
    name;

    constructor(name: string) {
        this.name = name;
    }

    // # means private method
    constructLogMessage(level: string, messages: string[]): string {
        return `${new Date().toUTCString()} ${level}: [${
            this.name
        }] ${messages.join(" ")}`;
    }

    info(...messages: string[]) {
        console.log(colors.green(this.constructLogMessage("INFO", messages)));
    }

    warn(...messages: string[]) {
        console.warn(colors.yellow(this.constructLogMessage("WARN", messages)));
    }

    error(...messages: string[]) {
        console.error(colors.red(this.constructLogMessage("ERROR", messages)));
    }
}
