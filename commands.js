const game = require ("./game.js");
const util = require ("./util.js");
const flag = require ("./flags.js");



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

// flag
new Command
(
    "flag",
    "Prints the value of a flag.\n" +
    "Usage:\n" +
    "  flag <flag>",
    (args) => {
        if (args.length > 0)
        {
            args.filter ((arg, pos) => args.indexOf (arg) == pos).forEach ((arg, i) => {
                if (Object.keys (flag).includes (arg))
                {
                    console.log (commands[arg].name);
                    console.log (util.indentString (commands[arg].helpText, "  "));
                }
                else
                {
                    console.log (`No such flag: ${arg}`);
                }
            });
        }
        else
        {
            console.log ("No flag specified.")
        }
    }
);

// flags
new Command
(
    "flags",
    "Prints all flag values.",
    (args) => {
        Object.keys (flag).forEach ((id, i) => {
            console.log (`${id}: ${flag[id]}`);
        });
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
            console.log ("  It supports two optional flags:");
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

// set
new Command
(
    "set",
    "Sets a global flag\n" +
    "Flags:\n" +
    Object.keys (flag).map ((f) => "  " + f).join (`\n`) + `\n` +
    "Usage:\n" +
    "  set <flag> <value>",
    (args) => {
        if (args.length < 2)
        {
            console.log ("Format: set <flag> <value>");
        }
        else if (!flag.hasOwnProperty (args[0]))
        {
            console.log (`No such flag: ${args[0]}`);
        }
        else if (isNaN (args[1]))
        {
            console.log (`${args[1]} is not a number.`);
        }
        else
        {
            flag[args[0]] = args[1];
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
        console.log (game.gameIsRunning () ? "  running" : "  not running");

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
