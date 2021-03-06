const express = require ("express");
const app = express ();
const http = require ("http").createServer (app);
const io = require ("socket.io") (http);
const fs = require ("fs");

import { v4 as uuidv4 } from 'uuid';

import * as game from "./game";
import {Address, User, Message, createMessage, Move, Result, TurnData, WinCondition, GameState} from "./game";
import * as cards from "./cards";
import {ICard, Card, DeadCard, NullCard, RoleCard, Faction, Team, TargetType} from "./cards";
import * as util from "./util";
import * as config from "./config";
import * as commands from "./commands";



// Command line arguments
let args: Array<string> = process.argv.slice (2);



// Set port to listen to
let port: number;
if (args[0])
    port = parseInt (args[0]);
else
    port = 8080;



// Set number of bots
let BOT_NAMES: Array<string> = ["Alice", "Bob", "Charlie", "Dan", "Erin", "Frank", "Grace", "Heidi"];
let botCount: number = Math.min (BOT_NAMES.length, parseInt (args[1]));

if (botCount > 0)
{
    console.log (`Adding ${botCount} bots to the game.`);

    BOT_NAMES.slice (0, botCount).forEach ((botName, i) => {
        game.addUser (i+"", null).setName (botName);
    });
}



// Set up command line interface
commands.setUpCommandLine ();



// Web sockets
io.on ("connection", socket => {
    socket.on ("connectWithToken", token => onConnect (socket, token));
    socket.emit ("requestToken", uuidv4 ());
});

function onConnect (socket, address)
{
    // Detect duplicate clients
    // if (game.hasUser (address) && game.getUser (address).online)
    // {
    //     socket.emit ("alreadyConnected");
    //     return;
    // }
    // else
    {
        socket.emit ("connected");
    }

    // Send card list (for card dex page)
    socket.emit ("setCardDex", cards.getCardDex ());

    // Add user/update old user with new socket
    let user: User = game.addUser (address, socket);

    // In case they are a returning user
    user.resendMessageLog ();
    user.sendClientData ();

    // Detect if they're already playing (reconnection)
    if (user.name != "")
    {
        socket.emit ("alreadyJoined");

        // Inform other users you have reconencted
        game.messageAllOtherUsers (user, createMessage (null, `${user.name} has reconnected.`, "server"));

        if (game.getGameState () == GameState.POST_GAME)
        {
            game.revealAllInformationTo (user);
        }

        // If enough players are online, start a game
        if (!game.gameIsActive () && game.getNonSpectatingUsers ().length >= config.settings.MINIMUM_PLAYER_COUNT)
        {
            startPregame ();
        }
    }
    else
    {
        socket.emit ("requestJoin");

        // Reset this in case the server was reset but the client didn't refresh
        socket.emit ("setTurnCountdown", -1);
    }

    socket.on ("disconnect", () => {
        user.disconnect ();

        // Inform other users you have disconnected
        game.messageAllOtherUsers (user, createMessage (null, `${user.name} has disconected.`, "server"));
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
        else if (user.name != "")
        {
            socket.emit ("joinError", "You already have a name. If this is an unexpected result, please report this error.");
        }
        else
        {
            user.setName (name);
            socket.emit ("joinAccepted", address);
            socket.emit ("setName", name);

            // Update player list for all players
            game.getAllUsers ().forEach (u => {
                user.emit ("setPlayers", game.getOtherPublicPlayerData (u), user.team != Team.SPECTATOR, game.gameIsActive ());
            });

            // Inform other players you have joined
            game.messageAllOtherPlayers (user, createMessage (null, `${user.name} has joined.`, "server"));

            // If enough players are online, start a game
            if (!game.gameIsActive () && game.getNonSpectatingUsers ().length >= config.settings.MINIMUM_PLAYER_COUNT)
            {
                startPregame ();
            }
        }
    });

    socket.on ("attemptPlay", (cardJSON, playerName) => {
        let card: Card = cards.cardFromTitle (cardJSON.title) as Card;
        let error = game.attemptMove (user, game.getPlayerWithName (playerName), card);

        if (error)
        {
            socket.emit ("failure");
            user.message (createMessage (null, error));
        }
        else
        {
            socket.emit ("success");
            user.message (createMessage (null, (playerName) ? `You played '${card.title}' on ${playerName}.` : `You played '${card.title}'.`));
            user.removeCardFromHand (card);
        }
    });
}

let turnCountdown, gameCountdown;

export function stopGame (): void // Exports so commands.ts can call it
{
    // Stop game loop
    clearTimeout (turnCountdown);
    clearTimeout (gameCountdown);

    // Reset game state
    game.stopGame ();

    // Update client data
    game.getAllUsers ().forEach (user => {
        user.sendClientData ();
    });
    io.emit ("setTurnCountdown", -1);

    // Inform all users
    game.messageAllUsers (createMessage (null, "The game was cancelled.", "server"));
}

export function startPregame (): void // Exports so commands.ts can call it
{
    game.startPregame ();
    game.messageAllUsers (createMessage (null, "New game", "header"));
    game.messageAllUsers (createMessage (null, `A game will begin in ${config.settings.PRE_GAME_TIME} seconds.`));
    setTimeout (() => {startGame ();}, config.settings.PRE_GAME_TIME * 1000);
}

function startGame (): void
{
    // Check a game is not already running, and that it was in pregame
    if (game.gameIsInProgress () || !game.gameIsActive ())
        return;

    // Check a game is viable
    if (game.getNonSpectatingUsers ().length < config.settings.MINIMUM_PLAYER_COUNT)
    {
        game.messageAllUsers (createMessage (null, "There are not enough non-spectating players online for a game. Waiting for more players."));
        game.stopGame ();
        return;
    }

    // Start game
    game.startGame ();

    io.emit ("startGame");
    game.messageAllUsers (createMessage (null, "A game has begun!", "header"));

    // Resend client data for each player
    game.getPlayers ().filter (user => !user.isBot).forEach (user => {
        user.sendClientData ();
        user.message (createMessage (null, game.getFactionWinCon (user.faction)));

        // Inform traitors of their allies
        if (user.team == Team.TRAITOR)
        {
            let otherTraitors = game.getPlayersOfTeam (Team.TRAITOR).filter (u => u != user).map (u => u.name);

            if (otherTraitors.length == 0)
                user.message (createMessage (null, "You are the only traitor."));
            else if (otherTraitors.length == 1)
                user.message (createMessage (null, `Your fellow traitor is ${util.formatList (otherTraitors)}.`));
            else
                user.message (createMessage (null, `Your fellow traitors are ${util.formatList (otherTraitors)}.`));
        }
    });

    // Start first turn
    runTurn ();
}

function runTurn (): void
{
    game.startTurn ();

    game.messageAllUsers (createMessage (null, `Turn ${game.getTurn ()} has begun.`, "header"));
    io.emit ("startTurn", game.getTurn ());

    // Inform each player's client of the card they have just drawn server side
    game.getPlayers ().forEach (user => {
        user.emit ("drawCard", user.getCards ().slice (-1)[0]);
    });

    let timeLeftInTurn: number = config.settings.TURN_TIME_LIMIT;
    turnCountdown = setInterval (() => {
        io.emit ("setTurnCountdown", timeLeftInTurn);
        timeLeftInTurn--;

        // Exit condition
        if (game.allPlayersHaveMoved () || timeLeftInTurn < 0)
        {
            // End countdown
            clearInterval (turnCountdown);
            io.emit ("setTurnCountdown", -1);



            // Randomise timed-out players
            game.randomiseRemainingMoves ();



            // Send out the results of actions
            let data: TurnData = game.getResultsOfTurn ();
            let results = data.results;
            Object.keys (results).forEach (address => {
                let user: User = game.getUser (address);

                // Send text results of actions
                results[address].messages.forEach (message => {
                    user.message (message);
                });

                // Update the known dead of each player
                game.getPlayers ().filter (u => u != user).forEach (otherUser => {
                    user.emit ("revealIsDead", {"name": otherUser.name, "isDead": user.getKnownDead ().includes (otherUser)});
                });

                // Resend hand data
                user.emit ("setCards", user.getCards ());
            });

            // Inform the newly killed they are dead
            data.newDead.forEach (user => {
                user.emit ("setIsDead", true);
            });



            // Check win conditions
            let winners = game.checkWinConditions ();

            if (winners)
            {
                setTimeout(() => runEndGame (winners), 1000);
            }
            else
            {
                runTurn ();
            }
        }
    }, 1000);
}

function runEndGame (winners: WinCondition): void
{
    io.emit ("setCards", []);

    game.endGame ();

    game.messageAllUsers (createMessage (null, "Game over!", "header"));
    game.getPlayers ().forEach (user => {
        user.emit ("endGame", user.hasWon (winners));
    });

    switch (winners)
    {
        case WinCondition.INNOCENT:
            game.messageAllUsers (createMessage (null, "The innocents won!"));
        break;

        case WinCondition.TRAITOR:
            game.messageAllUsers (createMessage (null, "The traitors won!"));
        break;

        case WinCondition.JESTER:
            game.messageAllUsers (createMessage (null, "The jester won!"));
        break;

        case WinCondition.SK:
            game.messageAllUsers (createMessage (null, "The serial killer won!"));
        break;

        case WinCondition.DRAW:
            game.messageAllUsers (createMessage (null, "Nobody won."));
        break;
    }

    let traitorPlayers = game.getPlayersOfFaction (Faction.TRAITOR).map (u => u.name);
    let detectivePlayers = game.getPlayersOfFaction (Faction.DETECTIVE).map (u => u.name);
    let jesterPlayers = game.getPlayersOfFaction (Faction.JESTER).map (u => u.name);
    let skPlayers = game.getPlayersOfFaction (Faction.SK).map (u => u.name);

    if (traitorPlayers.length == 1)
    {
        game.messageAllUsers (createMessage (null, `The traitor was ${util.formatList (traitorPlayers)}.`));
    }
    else
    {
        game.messageAllUsers (createMessage (null, `The traitors were ${util.formatList (traitorPlayers)}.`));
    }

    if (detectivePlayers.length == 1)
    {
        game.messageAllUsers (createMessage (null, `The detective was ${util.formatList (detectivePlayers)}.`));
    }
    else if (detectivePlayers.length > 1)
    {
        game.messageAllUsers (createMessage (null, `The detectives were ${util.formatList (detectivePlayers)}.`));
    }

    if (jesterPlayers.length == 1)
    {
        game.messageAllUsers (createMessage (null, `The jester was ${util.formatList (jesterPlayers)}.`));
    }
    if (skPlayers.length == 1)
    {
        game.messageAllUsers (createMessage (null, `The serial killer was ${util.formatList (skPlayers)}.`));
    }

    // Reveal all information
    game.revealAllInformation ();



    // Set up next game
    game.messageAllUsers (createMessage (null, "A new game will begin shortly."));

    let timeLeftUntilNewGame = config.settings.POST_GAME_TIME;
    gameCountdown = setInterval (() => {
        io.emit ("setTurnCountdown", timeLeftUntilNewGame);
        timeLeftUntilNewGame--;

        // Exit condition
        if (timeLeftUntilNewGame < 0)
        {
            // End countdown
            clearInterval (gameCountdown);
            io.emit ("setTurnCountdown", -1);

            // Start next game
            if (game.gameIsActive ())
                startGame ();
        }
    }, 1000);
}



// Static path
app.use (`/static`, express.static ("static"));



// Pages/redirects
app.get (`/`, (req, res) => {
    let html = fs.readFileSync (`${__dirname}/game.html`, "utf8");
    res.send (html);
});

app.get (`/*`, function (req, res) {
    res.writeHead (302, {"Location": `/`});
    res.end ();
});



// Error catching
app.use (function (err, req, res, next) {
	// Log error
	console.error ("Error detected:");
	console.error (err.stack);
	console.error ();

	// Send response
	res.writeHead (302, {"Location": `/`});
	res.end ();
});



// Run server
http.listen (port, () => {
    console.log (`Listening on *:${port}`);
});
