"use strict";

// Imports
let express = require ("express");
let app = express ();
let http = require ("http").createServer (app);
let io = require ("socket.io") (http);

let fs = require ("fs");

const game = require ("./game.js");
const cards = require ("./cards.js");
const util = require ("./util.js");
const config = require ("./config.js");
const commands = require ("./commands.js");


// Command line arguments
let args = process.argv.slice (2);



// Set port to listen to
let port;
if (args[0])
    port = args[0];
else
    port = 8080;



// Set number of bots
let BOT_NAMES = ["Alice", "Bob", "Charlie", "Dan", "Erin", "Frank", "Grace", "Heidi"];
let botCount = Math.min (BOT_NAMES.length, args[1]);

if (botCount > 0)
{
    console.log (`Adding ${botCount} bots to the game.`);

    for (let i = 0; i < botCount; i++)
    {
        game.addUser (i+"", null);
        game.nameUser (i+"", BOT_NAMES[i]);
    }
}



// Web sockets
io.on ("connection", (socket) => {
    let address = socket.handshake.address + "";
    console.log (`${address} connected.`);

    // Send card list (for card dex page)
    socket.emit ("setCardDex", cards.getCardDex ());

    // Detect duplicate clients
    if (game.userIsConnected (address))
    {
        socket.emit ("alreadyConnected");
        return;
    }
    else
    {
        socket.emit ("connected");
    }

    // Add user/update old user with new socket
    game.addUser (address, socket);
    game.resendMessageLogOf (address); // In case they are a returning user

    // Detect if they're already playing (reconnection)
    if (game.userHasJoined (address))
    {
        socket.emit ("alreadyJoined");
        socket.emit ("setPlayers", {otherPlayers: game.getOtherPublicPlayerData (address), isPlaying: true, gameIsRunning: game.gameIsRunning ()});
        socket.emit ("setFaction", (!game.isDead (address)) ? game.getFactionOf (address) : "dead");
        socket.emit ("setName", game.getNameOf (address));
        socket.emit ("setCards", game.getCardsOf (address));
        socket.emit ("revealMultipleDead", game.getKnownDeadOf (address).map (a => {return {name: game.getNameOf (a), isDead: true};}));

        if (game.getFactionOf (address) == "traitor")
        {
            let otherTraitors = game.getAddressesOfFaction ("traitor").filter (a => a != address).map (a => game.getNameOf (a));
            game.getSocketOf (address).emit ("revealTraitors", otherTraitors);
        }

        // Inform other users you have reconencted
        game.sendStatementToAllOtherUsers (`${game.getNameOf (address)} has reconnected.`, address, false);
    }
    else
    {
        socket.emit ("requestJoin");
        socket.emit ("setPlayers", {otherPlayers: game.getPublicPlayerData (), isPlaying: false, gameIsRunning: game.gameIsRunning ()});

        // Reset these in case the server was reset but the client didn't refresh
        socket.emit ("setCards", []);
        socket.emit ("setFaction", "spectator");
        socket.emit ("setCards", game.getCardsOf (address));
        socket.emit ("setTurnCountdown", -1);
    }

    socket.on ("disconnect", () => {
        console.log (`${address} disconnected.`);
        game.disconnectUser (address);

        // Inform other users you have disconnected
        if (game.userIsPlaying (address))
            game.sendStatementToAllOtherUsers (`${game.getNameOf (address)} has disconected.`, address, false);
    });

    socket.on ("attemptJoin", (name) => {
        name = name.trim ();
        if (name == "")
        {
            socket.emit ("joinError", "Please enter a name.");
        }
        else if (game.thereExistsPlayerWithName (name))
        {
            socket.emit ("joinError", "Name is already taken.");
        }
        else if (game.getNameOf (address) != "")
        {
            socket.emit ("joinError", "You already have a name. If this is an unexpected result, please report this error.");
        }
        else
        {
            game.nameUser (address, name);
            socket.emit ("joinAccepted", address);
            socket.emit ("setName", name);

            // Update player list for all players
            game.getPlayerAddresses ().forEach ((address, i) => {
                if (!game.isBot (address))
                {
                    game.getSocketOf (address).emit ("setPlayers", {otherPlayers: game.getOtherPublicPlayerData (address), isPlaying: true, gameIsRunning: game.gameIsRunning ()});
                }
            });

            // Inform other players you have joined
            game.sendStatementToAllOtherUsers (`${game.getNameOf (address)} has joined.`, address, false);

            // If enough players are online, start a game
            if (!game.gameIsRunning () && game.numberOfPotentialPlayers () >= config.settings.MINIMUM_PLAYER_COUNT)
            {
                game.startPregame ();
                game.sendStatementToAllUsers ("New game");
                game.sendStatementToAllUsers (`A game will begin in ${config.settings.PRE_GAME_TIME} seconds.`);
                setTimeout (() => {startGame ();}, config.settings.PRE_GAME_TIME * 1000);
            }
        }
    });

    socket.on ("attemptPlay", (card, playerName) => {
        let error = game.attemptMove (address, game.getPlayerAddressWithName (playerName), card.title);
        if (error)
        {
            socket.emit ("failure");
            game.sendStatementTo (address, error, false);
        }
        else
        {
            socket.emit ("success");
            if (playerName)
                game.sendStatementTo (address, `You played '${card.title}' on ${playerName}.`);
            else
                game.sendStatementTo (address, `You played '${card.title}'.`);
            game.removeCardFromHand (address, card.title);
        }
    });
});

function startGame ()
{
    // Check a game is not already running
    if (game.gameIsInProgress ())
        return;

    // Check a game is viable
    if (game.numberOfPotentialPlayers () < config.settings.MINIMUM_PLAYER_COUNT)
    {
        game.sendStatementToAllUsers ("There are not enough players online for a game. Waiting for more players.");
        return;
    }

    // Start game
    game.startGame ();

    io.emit ("startGame");
    game.sendStatementToAllUsers ("A game has begun!", true, true);

    // Set current player set for each player
    game.getPlayerAddresses ().forEach ((address, i) => {
        if (!game.isBot (address))
        {
            // Ensure the correct player list displays for all players
            game.getSocketOf (address).emit ("setPlayers", {otherPlayers: game.getOtherPublicPlayerData (address), isPlaying: true, gameIsRunning: game.gameIsRunning ()});

            // Set up start of game UI
            game.getSocketOf (address).emit ("setCards", game.getCardsOf (address));
            game.getSocketOf (address).emit ("setFaction", game.getFactionOf (address));
            game.sendStatementTo (address, game.getFactionWinCon (game.getFactionOf (address)));

            // Inform traitors of their allies
            if (game.getTeamOf (address) == "traitor")
            {
                let otherTraitors = game.getAddressesOfTeam ("traitor").filter (a => a != address).map (a => game.getNameOf (a));

                game.getSocketOf (address).emit ("revealTraitors", otherTraitors);

                if (otherTraitors.length == 0)
                    game.sendStatementTo (address, "You are the only traitor.");
                else if (otherTraitors.length == 1)
                    game.sendStatementTo (address, `Your fellow traitor is ${util.formatList (otherTraitors)}.`);
                else
                    game.sendStatementTo (address, `Your fellow traitors are ${util.formatList (otherTraitors)}.`);
            }
        }
    });

    runTurn ();
}

function runTurn ()
{
    game.startTurn ();

    game.sendStatementToAllUsers (`Turn ${game.getTurn (0)} has begun.`, true, true);
    io.emit ("startTurn", game.getTurn ());

    game.getPlayerAddresses ().forEach ((address, i) => {
        if (!game.isBot (address))
        {
            game.getSocketOf (address).emit ("drawCard", game.getCardsOf (address).slice (-1)[0]);
        }
    });

    let timeLeft = config.settings.TURN_TIME_LIMIT;
    let countdown = setInterval (() => {
        io.emit ("setTurnCountdown", timeLeft);
        timeLeft--;

        // Exit condition
        if (game.allPlayersMoved () || timeLeft < 0)
        {
            // End countdown
            clearInterval (countdown);
            io.emit ("setTurnCountdown", -1);



            // Randomise timed-out players
            game.randomiseRemainingMoves ();



            // Send out the results of actions
            let data = game.getResultsOfTurn ();
            let results = data.results;
            Object.keys (results).forEach ((address, i) => {
                if (!game.isBot (address))
                {
                    // Send text results of actions
                    results[address].messages.forEach ((message, j) => {
                        game.sendStatementTo (address, message);
                    });

                    // Update the known dead of each player
                    game.getPlayerAddresses ().forEach ((otherAddress, j) => {
                        game.getSocketOf (address).emit ("revealIsDead", {"name": game.getNameOf (otherAddress), "isDead": game.getKnownDeadOf (address).includes (otherAddress)});
                    });
                }
            });

            // Inform the newly killed they are dead
            data.newDead.forEach((address, i) => {
                if (!game.isBot (address))
                    game.getSocketOf (address).emit ("setIsDead", true);
            });



            // Check win conditions
            let winners = game.checkWinConditions ();

            if (winners)
            {
                io.emit ("setCards", []);
                game.endGame ();

                game.sendStatementToAllUsers ("Game over!");
                game.getPlayerAddresses ().forEach ((address, i) => {
                    if (!game.isBot (address))
                        game.getSocketOf (address).emit ("endGame", game.getTeamOf (address) == winners);
                });

                switch (winners)
                {
                    case "innocent":
                        game.sendStatementToAllUsers ("The innocents won!");
                    break;

                    case "traitor":
                        game.sendStatementToAllUsers ("The traitors won!");
                    break;

                    case "draw":
                        game.sendStatementToAllUsers ("It was a draw.");
                    break;
                }

                let traitorTeam = game.getAddressesOfFaction ("traitor").map (a => game.getNameOf (a));
                let detectiveTeam = game.getAddressesOfFaction ("detective").map (a => game.getNameOf (a));

                if (traitorTeam.length == 1)
                {
                    game.sendStatementToAllUsers (`The traitor was ${util.formatList (traitorTeam)}.`);
                }
                else
                {
                    game.sendStatementToAllUsers (`The traitors were ${util.formatList (traitorTeam)}.`);
                }

                if (detectiveTeam.length == 1)
                {
                    game.sendStatementToAllUsers (`The detective was ${util.formatList (detectiveTeam)}.`);
                }
                else if (detectiveTeam.length > 1)
                {
                    game.sendStatementToAllUsers (`The detectives were ${util.formatList (detectiveTeam)}.`);
                }

                // Reveal all information
                let factionInfo = game.getPlayerAddresses ().map ((a) => {return {"name": game.getNameOf (a), "faction": game.getFactionOf (a)};});
                let deathInfo = game.getPlayerAddresses ().map ((a) => {return {"name": game.getNameOf (a), "isDead": game.isDead (a)};});

                game.getPlayerAddresses ().forEach ((address, i) => {
                    if (!game.isBot (address))
                    {
                        let socket = game.getSocketOf (address);
                        socket.emit ("revealFactions", factionInfo);
                        socket.emit ("revealMultipleDead", deathInfo);
                    }
                });



                game.sendStatementToAllUsers ("A new game will begin shortly.");

                let timeLeftUntilNewGame = config.settings.POST_GAME_TIME;
                let gameCountdown = setInterval (() => {
                    io.emit ("setTurnCountdown", timeLeftUntilNewGame);
                    timeLeftUntilNewGame--;

                    // Exit condition
                    if (timeLeftUntilNewGame < 0)
                    {
                        // End countdown
                        clearInterval (gameCountdown);
                        io.emit ("setTurnCountdown", -1);

                        // Start next game
                        startGame ();
                    }
                }, 1000);
            }
            else
            {
                runTurn ();
            }
        }
    }, 1000);
}



// Static path
app.use ("*/static", express.static (__dirname + "/static"));



// Pages/redirects
app.get ("/", (req, res) => {
    let html = fs.readFileSync (`${__dirname}/game.html`, "utf8");
    res.send (html);
});

app.get ("*", function (req, res) {
    res.writeHead (302, {"Location": "/"});
    res.end ();
});



// Error catching
app.use (function (err, req, res, next) {
	// Log error
	console.error ("Error detected:");
	console.error (err.stack);
	console.error ();

	// Send response
	res.writeHead (302, {"Location": "/"});
	res.end ();
});



// Run server
http.listen (port, () => {
    console.log (`Listening on *:${port}`);
});
