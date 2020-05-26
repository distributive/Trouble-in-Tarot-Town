const cards = require ("./cards.js");
const util = require ("./util.js");
const config = require ("./config.js");

const GAME_NO_GAME = 0;
const GAME_RUNNING = 1;
const GAME_PREGAME = 2;
const GAME_POSTGAME = 3;

let users = {};
let playerAddresses = [];
let gameState = GAME_NO_GAME;



let innocentDeck = [], traitorDeck = [], detectiveDeck = [];



function User (address, socket)
{
    this.address = address;
    this.socket = socket;
    this.name = "";
    this.online = true;
    this.faction = "spectator";
    this.team = "spectator";
    this.dead = false;
    this.hand = [];
    this.messages = [];
    this.knownDead = [];
}



/* USERS */
function addUser (address, socket)
{
    if (hasUser (address))
    {
        users[address].online = true;
        users[address].socket = socket;
    }
    else
    {
        users[address] = new User (address, socket);
    }
}

function disconnectUser (address)
{
    if (hasUser (address))
        users[address].online = false;
}

function removeUser (address)
{
    removePlayer (address);
    delete users[address];
}

function hasUser (address)
{
    return users.hasOwnProperty (address);
}

function userIsConnected (address)
{
    if (!hasUser (address))
        return false;

    return users[address].online;
}

function getUserAddresses ()
{
    return Object.keys (users);
}

function userCount ()
{
    return Object.keys (users).length;
}

function getSocketOf (address)
{
    if (!hasUser (address))
        return null;

    return users[address].socket;
}

function isBot (address)
{
    if (!hasUser (address))
        return false;

    return users[address].socket == null;
}

function sendMessageTo (address, sender, message, storeInLog = true)
{
    if (!hasUser (address) || users[address].socket == null)
        return;

    let content = {"sender": sender, "message": message, "divider": divider};

    if (storeInLog)
        users[address].messages.push (content);
    users[address].socket.emit ("message", content);
}

function sendStatementTo (address, message, storeInLog = true, divider = false)
{
    if (!hasUser (address) || users[address].socket == null)
        return;

    let content = {"sender": null, "message": message, "divider": divider};

    if (storeInLog)
        users[address].messages.push (content);
    users[address].socket.emit ("message", content);
}

function sendStatementToAllUsers (message, storeInLog = true, divider = false)
{
    Object.keys (users).forEach((address, i) => {
        sendStatementTo (address, message, storeInLog, divider);
    });
}

function sendStatementToAllOtherUsers (message, address, storeInLog = true, divider = false)
{
    Object.keys (users).filter (user => user != address).forEach((address, i) => {
        sendStatementTo (address, message, storeInLog, divider);
    });
}

function sendStatementToAllPlayers (message, storeInLog = true, divider = false)
{
    playerAddresses.forEach((address, i) => {
        sendStatementTo (address, message, storeInLog, divider);
    });
}

function sendStatementToAllOtherPlayers (message, address, storeInLog = true, divider = false)
{
    playerAddresses.filter (user => user != address).forEach((address, i) => {
        sendStatementTo (address, message, storeInLog, divider);
    });
}

function sendStatementToAllPlayersOfFaction (message, faction, storeInLog = true, divider = false)
{
    playerAddresses.filter (a => getFactionOf (a) == faction).forEach((address, i) => {
        sendStatementTo (address, message, storeInLog, divider);
    });
}

function getMessageLogOf (address)
{
    if (!hasUser (address))
        return [];

    return users[address].messages.filter (_ => true);
}

function resendMessageLogOf (address)
{
    let socket = getSocketOf (address);

    getMessageLogOf (address).forEach ((message, i) => {
        socket.emit ("message", {"sender": message.sender, "message": message.message, "divider": message.divider});
    });
}
/* USERS END */



/* PLAYERS */
function addPlayer (address, name)
{
    if (!hasUser (address) || playerAddresses.includes (address))
        return;

    users[address].name = name;
    playerAddresses.push (address);
}

function removePlayer (address)
{
    if (!hasUser (address))
        return;

    playerAddresses = playerAddresses.filter (e => e != address);
}

function getPlayerAddresses ()
{
    return playerAddresses.filter (_ => true);
}

function userIsPlaying (address)
{
    if (!hasUser (address))
        return false;

    return playerAddresses.includes (address);
}

function getNameOf (address)
{
    if (!hasUser (address))
        return "";

    return users[address].name;
}

function getPlayerNames ()
{
    return playerAddresses.map (p => users[p].name);
}
function getOtherPlayerNames (address)
{
    return playerAddresses.filter (p => users[p].address != address).map (p => users[p].name);
}

function getPublicPlayerData () // returns name and whether they're a spectator for each player
{
    return playerAddresses.map ((p) => {return {"name": users[p].name, "isActive": users[p].team != "spectator"}});
}
function getOtherPublicPlayerData (address)
{
    return playerAddresses.filter (p => users[p].address != address).map ((p) => {return {"name": users[p].name, "isActive": users[p].team != "spectator"}});
}

function thereExistsPlayerWithName (name)
{
    name = name.toLowerCase ();
    return playerAddresses.some (p => users[p].name.toLowerCase () == name);
}

function getPlayerAddressWithName (name)
{
    if (name == null)
        return null;

    name = name.toLowerCase ();
    let results = playerAddresses.filter (a => users[a].name.toLowerCase () == name);

    if (results.length == 0)
        return null;
    return results[0];
}

function getFactionOf (address)
{
    if (!hasUser (address))
        return "";

    return users[address].faction;
}

function getTeamOf (address)
{
    if (!hasUser (address))
        return "";

    return users[address].team;
}

function getFactionWinCon (faction)
{
    if (faction == "innocent")
        return "You are innocent. Kill all traitors to win.";
    if (faction == "traitor")
        return "You are a traitor. Kill all non-traitors to win.";
    if (faction == "detective")
        return "You are a detective. Kill all traitors to win.";
}

function getAddressesOfFaction (faction)
{
    return playerAddresses.filter (address => users[address].faction == faction);
}

function getAddressesOfTeam (team)
{
    return playerAddresses.filter (address => users[address].team == team);
}

function getCardsOf (address)
{
    if (!hasUser (address))
        return [];

    return users[address].hand;
}

function isDead (address)
{
    return users[address].dead;
}

function getAllDead ()
{
    return playerAddresses.filter (address => isDead (address));
}

function getAllLiving ()
{
    return playerAddresses.filter (address => !isDead (address));
}

function removeCardFromHand (address, cardTitle)
{
    if (!hasUser (address) || !users[address].hand.some (card => card.title == cardTitle))
        return;

    users[address].hand.splice (users[address].hand.findIndex (card => card.title == cardTitle), 1);
}

function killPlayer (address)
{
    if (!hasUser (address))
        return;

    users[address].dead = true;
}

function getKnownDeadOf (address)
{
    if (!hasUser (address))
        return;

    return users[address].knownDead;
}

function resetPlayers ()
{
    playerAddresses.forEach ((address, i) => {
        users[address].faction = "spectator";
        users[address].team = "spectator";
        users[address].dead = false;
        users[address].hand = [];
        users[address].messages = [];
        users[address].knownDead = [];
    });
}
/* PLAYERS END */



/* GAME LOGIC */
let moves = {};
let turn = 0;

function Move (source, target, cardTitle)
{
    this.source = source; // Source player address
    this.target = target; // Target player address
    this.cardTitle = cardTitle;
}

function Result (address, isDead)
{
    this.address = address;
    this.isDead = isDead;
    this.messages = [];
}

function getGameState ()
{
    return gameState;
}

function getGameStateString ()
{
    switch (gameState)
    {
        case GAME_NO_GAME:
            return "NO GAME";
        case GAME_PREGAME:
            return "PREGAME";
        case GAME_RUNNING:
            return "RUNNING";
        case GAME_POSTGAME:
            return "POSTGAME";
    }
}

function gameIsRunning ()
{
    return gameState != GAME_NO_GAME;
}

function gameIsInProgress ()
{
    return gameState == GAME_RUNNING;
}

function getTurn ()
{
    return turn;
}

function startPregame ()
{
    gameState = GAME_PREGAME;
}

function startGame ()
{
    gameState = GAME_RUNNING;
    turn = 0;
    resetPlayers ();

    let traitorCount = Math.ceil (config.settings.TRAITOR_FRACTION * playerAddresses.length + config.settings.TRAITOR_CONSTANT);
    let detectiveCount = Math.floor (config.settings.DETECTIVE_FRACTION * playerAddresses.length + config.settings.DETECTIVE_CONSTANT);
    let innocentCount = Math.max (0, playerAddresses.length - traitorCount - detectiveCount);

    let roleDeck = cards.generateRoleDeck (innocentCount, traitorCount, detectiveCount);

    playerAddresses.forEach ((address, i) => {
        let roleCard = roleDeck.pop ();
        users[address].hand = [roleCard];
        users[address].faction = roleCard.faction;
        users[address].team = roleCard.team;

        users[address].hand.push (drawFromFactionDeck (roleCard.faction));
        users[address].hand.push (drawFromFactionDeck (roleCard.faction));
    });
}

function endGame ()
{
    gameState = GAME_POSTGAME;

    playerAddresses.forEach ((address, i) => {
        users[address].hand = [];
    });
}

function startTurn ()
{
    turn++;
    moves = {};

    playerAddresses.forEach ((address, i) => {
        if (isDead (address))
        {
            users[address].hand.push (cards.getDeadCard ());
        }
        else
        {
            users[address].hand.push (drawFromFactionDeck (users[address].faction));
        }
    });
}

function attemptMove (source, target, cardTitle, playerAddresses)
{
    if (moves.hasOwnProperty (source))
    {
        return "You have already played a card this turn.";
    }
    else if (isDead (source) && !cards.isDeadCardTitle (cardTitle))
    {
        return "You are dead; you must play your DEAD card.";
    }
    else if (cards.isIdCardTitle (cardTitle))
    {
        return "You cannot play your ID card.";
    }
    else if (getTeamOf (target) == "spectator")
    {
        return "This player is not in the current game.";
    }
    else if (cards.isTargettedTitle (cardTitle) && target == null)
    {
        return "This card needs a target player.";
    }
    else if (!cards.isTargettedTitle (cardTitle) && target != null)
    {
        return "This card does not target a player.";
    }
    else if (hasUser (source) && !users[source].hand.some (c => c.title == cardTitle))
    {
        return "You do not have this card in hand. If this is an unexpected result, please report this error.";
    }

    moves[source] = new Move (source, target, cardTitle);
    return null;
}

function allPlayersMoved ()
{
    return playerAddresses.every (address => moves.hasOwnProperty (address));
}

function randomiseRemainingMoves ()
{
    playerAddresses.filter (a => !moves.hasOwnProperty (a)).forEach ((address, i) => {
        let target, card;
        if (isDead (address))
        {
            card = users[address].hand.filter (c => cards.isDeadCard (c))[0];
        }
        else
        {
            card = util.shuffle (users[address].hand.slice (1))[0]; // Slice (1) to remove ID
        }

        target = (cards.isTargettedTitle (card.title)) ? util.shuffle (playerAddresses.filter (a => a != address))[0] : null;

        moves[address] = new Move (address, target, card.title);
        removeCardFromHand (address, card.title);

        if (!isBot (address))
        {
            sendStatementTo (address, "You did not perform an action in time, so your action was performed randomly.", false);
            sendStatementTo (address, `You played ${card.title} on ${getNameOf (target)}.`, false);
            getSocketOf (address).emit ("forcePlay", {"card": card, "target": getNameOf (target)});
        }
    });
}

function getResultsOfTurn ()
{
    let results = {};
    let killed = [];

    // Set up initial state of each player
    playerAddresses.forEach ((address, i) => {
        results[address] = new Result (address, isDead (address));
    });

    // Jails must be determined first
    playerAddresses.forEach ((address, i) => {
        if (moves[address].cardTitle == cards.jailTitle && moves[moves[address].target].cardTitle != cards.jailTitle)
        {
            moves[moves[address].target].cardTitle = cards.nullTitle;
            moves[moves[address].target].target = null;
            results[moves[address].target].messages.push ("Your action was ineffective.");
        }
    });

    // Perform remaining moves in a random order
    util.shuffle (playerAddresses.filter (a => moves.hasOwnProperty (a))).forEach ((address, i) => {
        let targetAddress = moves[address].target;
        let targetName = getNameOf (targetAddress);

        switch (moves[address].cardTitle)
        {
            case cards.witnessTitle:
                // See visits involving the target
                let visited = moves[targetAddress].target;
                let visitors = playerAddresses.filter (a => a != address && moves[a].target == targetAddress);

                let r1 = (visited == null)    ? `${targetName} did not visit anyone.` :
                         (visited == address) ? `${targetName} visited you.` :
                                                `${targetName} visited ${getNameOf (visited)}.`;
                let r2 = (visitors.length > 0) ? `${targetName} was visited by ${util.formatList (visitors.map (a => getNameOf (a)))}.` :
                                                 `Nobody else visited ${targetName}.`;

                results[address].messages.push (r1);
                results[address].messages.push (r2);

                // Respond to kills/death
                if (isDead (targetAddress))
                {
                    results[address].messages.push (`${targetName} was already dead before you found them.`);
                    logDeath (address, targetAddress, true);
                }
                else
                {
                    // Correct fake death claims on being proved false
                    logDeath (address, targetAddress, false);

                    // Detect kills involving the target
                    let killers = playerAddresses.filter (a => moves[a].target == targetAddress && moves[a].cardTitle == cards.killTitle);
                    let victims = (moves[targetAddress].cardTitle == cards.killTitle) ? [moves[targetAddress].target] :
                                  (moves[targetAddress].cardTitle == cards.c4Title) ? playerAddresses.filter (a => moves[a].target == targetAddress) :
                                  [];

                    // Log deaths
                    victims.forEach ((victim, i) => {
                        logDeath (address, victim, true);
                    });


                    if (killers.length > 0)
                        results[address].messages.push (`${targetName} was killed by ${util.formatList (killers.map (a => getNameOf (a)))}.`);
                    if (victims.length > 0)
                        results[address].messages.push (`${targetName} killed ${util.formatList (victims.map (a => getNameOf (a)))}.`);
                }
            break;

            case cards.killTitle:
                if (moves[targetAddress].cardTitle == cards.killTitle && moves[targetAddress].target == address)
                {
                    results[address].messages.push ("Your action was ineffective.");
                }
                else
                {
                    let response = (isDead (targetAddress)) ? `${targetName} is already dead.` : `You killed ${targetName}.`;
                    results[address].messages.push (response);
                    logDeath (address, targetAddress, true);

                    if (!results[targetAddress].isDead)
                    {
                        results[targetAddress].isDead = true;
                        results[targetAddress].messages.push ("You have been killed.");
                        killed.push (targetAddress);
                    }
                }
            break;

            case cards.deadTitle:
                results[targetAddress].messages.push (`${getNameOf (address)} informed you they are dead.`);
                logDeath (targetAddress, address, true);
            break;

            case cards.inspectTitle:
                let randomCard = util.choose (users[targetAddress].hand);
                results[address].messages.push (`You see that ${targetName} is holding ${randomCard.title}.`);
                results[address].messages.push (`${randomCard.title} reads: '${randomCard.description}'.`);
            break;

            case cards.tamperTitle:
                if (isDead (targetAddress))
                {
                    users[targetAddress].hand = [];
                    results[address].messages.push (`You removed all cards left in ${targetName}'s hand.`);
                    results[targetAddress].messages.push (`Someone removed all cards from your hand.`);
                }
                else
                {
                    results[address].messages.push ("Your action was ineffective.");
                }
            break;

            case cards.disguseTitle:
            break;

            case cards.c4Title:
                let victims = playerAddresses.filter (a => moves[a].target == address);
                victims.forEach ((victim, i) => {
                    if (!results[victim].isDead)
                    {
                        results[victim].isDead = true;
                        results[victim].messages.push ("You have been blown up.");
                        killed.push (victim);
                    }

                    logDeath (address, victim, true);
                });

                if (victims.length > 0)
                    results[address].messages.push (`You blew up ${util.formatList (victims.map (v => getNameOf (v)))}.`);
                else
                    results[address].messages.push ("You did not blow anyone up.");
            break;

            case cards.titlePlayDead:
                results[targetAddress].messages.push (`${getNameOf (address)} informed you they are dead.`);
                logDeath (targetAddress, address, true);
            break;
        }
    });

    // Perform kills
    killed.forEach((address, i) => {
        killPlayer (address);
    });

    return {"results": results, "newDead": killed};
}

function checkWinConditions ()
{
    let areTowniesAlive = getAddressesOfFaction ("innocent").concat (getAddressesOfFaction ("detective")).some (a => !isDead (a));
    let areTraitorsAlive = getAddressesOfFaction ("traitor").some (a => !isDead (a));

    if (areTowniesAlive && !areTraitorsAlive)
        return "innocent";
    else if (areTraitorsAlive && !areTowniesAlive)
        return "traitor";
    else if (!areTowniesAlive && !areTraitorsAlive)
        return "draw";
    else
        return "";
}

// PRIVATE
function drawFromFactionDeck (faction)
{
    if (faction == "innocent")
    {
        if (innocentDeck.length <= 0)
            innocentDeck = cards.generateInnocentDeck (1);
        return innocentDeck.pop ();
    }
    else if (faction == "traitor")
    {
        if (traitorDeck.length <= 0)
            traitorDeck = cards.generateTraitorDeck (1);
        return traitorDeck.pop ();
    }
    else if (faction == "detective")
    {
        if (detectiveDeck.length <= 0)
            detectiveDeck = cards.generateDetectiveDeck (1);
        return detectiveDeck.pop ();
    }
}

// PRIVATE
function logDeath (address, target, isTargetDead)
{
    if (isTargetDead)
    {
        if (!users[address].knownDead.includes (target))
            users[address].knownDead.push (target);
    }
    else
    {
        users[address].knownDead = users[address].knownDead.filter (a => a != target);
    }
}
/* GAME LOGIC END */



module.exports = {
    addUser,
    removeUser,
    disconnectUser,
    hasUser,
    userIsConnected,
    getUserAddresses,
    userCount,
    getSocketOf,
    isBot,

    sendMessageTo,
    sendStatementTo,
    sendStatementToAllUsers,
    sendStatementToAllOtherUsers,
    sendStatementToAllPlayers,
    sendStatementToAllOtherPlayers,
    sendStatementToAllPlayersOfFaction,
    getMessageLogOf,
    resendMessageLogOf,

    addPlayer,
    removePlayer,
    getPlayerAddresses,
    userIsPlaying,
    getNameOf,
    getPlayerNames,
    getOtherPlayerNames,
    getPublicPlayerData,
    getOtherPublicPlayerData,
    thereExistsPlayerWithName,
    getPlayerAddressWithName,
    getFactionOf,
    getTeamOf,
    getFactionWinCon,
    getAddressesOfFaction,
    getAddressesOfTeam,
    getCardsOf,
    isDead,
    getAllDead,
    getAllLiving,
    removeCardFromHand,
    killPlayer,
    getKnownDeadOf,
    resetPlayers,

    getGameState,
    getGameStateString,
    gameIsRunning,
    gameIsInProgress,
    getTurn,
    startPregame,
    startGame,
    endGame,
    startTurn,
    attemptMove,
    allPlayersMoved,
    randomiseRemainingMoves,
    getResultsOfTurn,
    checkWinConditions
};
