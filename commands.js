const game = require ("./game.js");
const util = require ("./util.js");
const config = require ("./config.js");


let commands = {};

function Command (name, helpText, effect)
{
    this.name = name;
    this.helpText = helpText;
    this.effect = effect;

    commands[name] = this;
}



// exit
new Command
(
    "exit",
    "Forces the server to close.",
    (args) => {
        game.sendStatementToAllUsers ("Server has been closed.");
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
            console.log ("    <port> defines the port to listen to (default 8080).");
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
            config.settings[args[0]] = parseInt (args[1]);
            config.saveSettings ();
            console.log (`Set value of ${args[0]} to ${args[1]}.`);
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

        console.log ("USERS");
        game.getUserAddresses ().forEach ((address, i) => {
            console.log ("  " + address);
        });

        console.log ();

        console.log ("PLAYER ADDRESSES/NAMES");
        game.getPlayerAddresses ().forEach ((address, i) => {
            console.log ("  " + address + " / " + game.getNameOf (address));
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
let stdin = process.stdin;
stdin.setEncoding ("utf-8");

stdin.on ("data", (data) => {

    // Clean up input
    data = data.trim ();

    // Discard empty commands
    if (data == "")
        return;

    // Format
    data = data.split (' ').map (arg => arg.trim ()).filter (arg => arg);
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
