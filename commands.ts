import {startPregame, stopGame} from "./server";
import * as game from "./game";
import {createMessage} from "./game";
import * as util from "./util";
import * as config from "./config";



let commands = {};

function Command (name, helpText, effect)
{
    this.name = name;
    this.helpText = helpText;
    this.effect = effect;

    commands[name] = this;
}



// help
new Command
(
    "help",
    "Shows one or more commands' help text.\n" +
    "If none is specified, show this message.\n" +
    "Usage:\n" +
    "  help [<command>]\n" +
    "  help",
    (args) => {
        if (args.length > 0)
        {
            args.filter ((arg, pos) => args.indexOf (arg) == pos).forEach ((arg, i) => {
                if (Object.keys (commands).includes (arg))
                {
                    console.log (commands[arg].name);
                    console.log (util.indentString (commands[arg].helpText, "  "));
                }
                else
                {
                    console.log (`  No such command: ${arg}`);
                }
            });
        }
        else
        {
            console.log ();
            console.log ("================================================================");
            console.log ();

            console.log ("RUNNING THE SERVER");
            console.log ("  This server must be run using node: `node <path>/server.js`");
            console.log ("  It supports two optional options:");
            console.log ("    `node <path>/server.js <port> <bots>`");
            console.log ("    <port> defines the port to listen to (default: 8080).");
            console.log (`    <bots> defines the number of bots to load to (default: 0, max: 8, NOTE: for testing only).`);

            console.log ();
            console.log ("================================================================");
            console.log ();

            console.log ("AVAILABLE COMMANDS");

            Object.keys (commands).map (name => commands[name]).forEach ((command, i) => {
                console.log (command.name);
                console.log (util.indentString (command.helpText, "  "));
            });

            console.log ();
            console.log ("================================================================");
            console.log ();
        }
    }
);

// exit
new Command
(
    "exit",
    "Forces the server to close.",
    (args) => {
        game.messageAllUsers (createMessage (null, "Server has been closed."));
        console.log ("Force closed.");
        process.exit ();
    }
);

// get
new Command
(
    "get",
    "Prints the value of a setting.\n" +
    "Prints all settings if none specified.\n" +
    "Usage:\n" +
    "  get <setting>\n" +
    "  get",
    (args) => {
        if (args.length > 0)
        {
            util.removeDuplicates (args).forEach ((arg, i) => {
                if (Object.keys (config.settings).includes (arg))
                {
                    console.log (config.settings[arg]);
                }
                else
                {
                    console.error (`No such setting: ${arg}`);
                }
            });
        }
        else
        {
            Object.keys (config.settings).forEach ((id, i) => {
                console.log (`${id}: ${config.settings[id]}`);
            });
        }
    }
);

// set
new Command
(
    "set",
    "Sets a global setting\n" +
    "Settings:\n" +
    Object.keys (config.settings).map ((f) => "  " + f).join (`\n`) + `\n` +
    "Usage:\n" +
    "  set <setting> <value>",
    (args) => {
        if (args.length < 2)
        {
            console.error ("Format: set <setting> <value>");
        }
        else if (!config.settings.hasOwnProperty (args[0]))
        {
            console.error (`No such setting: ${args[0]}`);
        }
        else if (isNaN (args[1]))
        {
            console.error (`${args[1]} is not a number.`);
        }
        else
        {
            config.settings[args[0]] = parseFloat (args[1]);
            config.saveSettings ();
            console.log (`Set value of ${args[0]} to ${args[1]}.`);
        }
    }
);

// reset
new Command
(
    "reset",
    "Resets a settings to its default value.\n" +
    "Resets all settings if none specified.\n" +
    "Settings:\n" +
    Object.keys (config.settings).map ((f) => "  " + f).join (`\n`) + `\n` +
    "Usage:\n" +
    "  reset <setting>\n" +
    "  reset",
    (args) => {
        if (args.length == 0)
        {
            config.loadDefaults ();
            console.log ("Reset settings to default values.");
        }
        else
        {
            args.forEach ((arg, i) => {
                if (config.settings.hasOwnProperty (arg))
                {
                    config.loadDefault (arg);
                    console.log (`Reset ${arg} to: ${config.settings[arg]}`);
                }
                else
                {
                    console.error (`No such setting: ${arg}`);
                }
            });
        }
        config.saveSettings ();
    }
);

// startgame
new Command
(
    "startgame",
    "If a game is not currently active, being set up, or in the post-game phase, start one.",
    (args) => {
        if (!game.gameIsActive ())
        {
            console.log ("Game started");
            startPregame ();
        }
        else
        {
            console.log ("A game is already running");
        }

    }
);

// stopgame
new Command
(
    "stopgame",
    "If a game is currently active, being set up, or in the post-game phase, stop it.",
    (args) => {
        if (game.gameIsActive ())
        {
            console.log ("Game stopped");
            stopGame ();
        }
        else
        {
            console.log ("No game is running");
        }

    }
);

// status
new Command
(
    "status",
    "Prints the current state of the game: users, players, game state.",
    (args) => {
        console.log ();
        console.log ("================================================================");
        console.log ();

        console.log ("USERS NAMES/ADDRESSES");
        game.getAllUsers ().forEach (user => {
            console.log (`  ${user.address} / ${user.name}`);
        });

        console.log ();

        console.log ("PLAYERS");
        game.getPlayers ().forEach (user => {
            console.log (util.indentString (user.dump (), "  "));
            console.log ();
        });

        console.log ();

        console.log ("GAME STATE");
        console.log ("  " + game.getGameStateString ());

        console.log ();
        console.log ("================================================================");
        console.log ();
    }
);



// Catch command line events
export function setUpCommandLine (): void
{
    let stdin = process.stdin;
    stdin.setEncoding ("utf-8");

    stdin.on ("data", (buffer) => {
        // Format input
        let data = buffer.toString ().trim ().split (' ').map (arg => arg.trim ()).filter (arg => arg);

        // Discard empty commands
        if (data.length == 0)
            return;

        let command = data[0];
        let args = data.slice (1);

        if (commands.hasOwnProperty (command))
        {
            commands[command].effect (args);
        }
        else
        {
            console.log ("Unknown command. Enter `help` for a full list of available commands.");
        }
    });
}
