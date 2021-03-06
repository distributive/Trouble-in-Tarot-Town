import * as cards from "./cards";
import {ICard, Card, DeadCard, NullCard, RoleCard, Faction, Team, TargetType} from "./cards";
import * as util from "./util";
import * as config from "./config";



export type Address = string;

export enum Effect { KILLED_BY_KILL }
export enum WinCondition { NONE, DRAW, INNOCENT, TRAITOR, JESTER, SK }



let users: Record<Address, User> = {};

let innocentDeck: Array<Card> = [];
let traitorDeck: Array<Card> = [];
let detectiveDeck: Array<Card> = [];
let jesterDeck: Array<Card> = [];
let skDeck: Array<Card> = [];




export interface Message
{
    sender: Address;
    content: string;
    type: string;
}
export function createMessage (sender: Address, content: string, type: string = ""): Message
{
    return {
        "sender": sender,
        "content": content,
        "type": type,
    };
}

export class User
{
    readonly _address: string;
    private _socket: any;
    private _name: string;
    private _online: boolean;
    private _faction: Faction;
    private _team: Team;
    private _dead: boolean;
    private _hand: Array<ICard>;
    private _messages: Array<Message>;
    private _knownDead: Array<User>;
    private _inGame: boolean;
    private _effects: Array<Effect>;

    constructor (address, socket)
    {
        this._address = address;
        this._socket = socket;
        this._name = "";
        this._online = true;
        this._faction = Faction.NONE;
        this._team = Team.NONE;
        this._dead = false;
        this._hand = [];
        this._messages = [];
        this._knownDead = [];
        this._inGame = false;
        this._effects = [];
    }

    get address (): Address {return this._address;}
    get name (): string {return this._name;}

    get faction (): Faction {return this._faction;}
    set faction (value: Faction) {this._faction = value;}

    get team (): Team {return this._team;}
    set team (value: Team) {this._team = value;}

    get online (): boolean {return this._online;}
    get inGame (): boolean {return this._inGame;}
    get isDead (): boolean {return this._dead;}

    get publicData (): object
    {
        return {
            "name": this._name,
            "isActive": this._team != Team.SPECTATOR && this._team != Team.NONE,
            "online": this._online
        }
    }

    get isBot (): boolean {return this._socket == null;}

    reset ()
    {
        this._faction = Faction.NONE;
        this._team = Team.NONE;
        this._dead = false;
        this._hand = [];
        this._messages = [];
        this._knownDead = [];
        this._inGame = false;
        this._effects = [];
    }

    connect (socket: any): void
    {
        this._socket = socket;
        this._online = true;
    }
    disconnect (): void
    {
        this._online = false;
    }

    setName (name: string): void
    {
        this._name = name;
    }

    addToGame (): void
    {
        this._inGame = true;
    }
    removeFromGame (): void
    {
        this._inGame = false;
    }

    emit (flag: string, ...content: any[]): void
    {
        if (this._socket == null)
            return;

        this._socket.emit (flag, ...content);
    }
    sendClientData (): void
    {
        this.emit ("setName", this._name);
        this.emit ("setPlayers", getOtherPublicPlayerData (this), this._team != Team.SPECTATOR, gameIsActive ());
        this.emit ("setFaction", (this._dead) ? "dead" : this._faction);
        this.emit ("setCards", this.getCards ());
        this.emit ("revealMultipleDead", this._knownDead.map (u => {return {name: u.name, isDead: true};}));

        if (this._team == Team.TRAITOR)
        {
            let otherTraitors = getPlayersOfTeam (Team.TRAITOR).filter (u => u != this);
            this.emit ("revealTeams", otherTraitors.map (u => {return {"name": u.name, "team": u.team};}));
            this.emit ("revealFactions", otherTraitors.map (u => {return {"name": u.name, "faction": u.faction};}));

            let anarchists = getPlayersOfTeam (Team.ANARCHIST);
            this.emit ("revealTeams", anarchists.map (u => {return {"name": u.name, "team": u.team};}));
        }
    }

    message (message: Message, storeInLog: boolean = true): void
    {
        if (storeInLog)
            this._messages.push (message);
        this.emit ("message", message);
    }
    resendMessageLog (): void
    {
        if (this._socket == null)
            return;

        this._messages.forEach ((message, i) => {
            this.emit ("message", message);
        });
    }

    drawCard (card: ICard): void
    {
        this._hand.push (card);
    }
    clearHand (): void
    {
        this._hand = [];
    }
    removeCardFromHand (card: ICard): void
    {
        if (!this._hand.some (c => c.title == card.title))
            return;

        this._hand.splice (this._hand.findIndex (c => c.title == card.title), 1);
    }
    hasCard (card: ICard): boolean
    {
        return this._hand.includes (card);
    }
    getCards (): Array<ICard>
    {
        return this._hand.slice ();
    }

    kill (): void
    {
        this._dead = true;
    }

    getKnownDead (): Array<User>
    {
        return this._knownDead.slice ();
    }
    addKnownDeath (victim: User): void
    {
        if (!this._knownDead.includes (victim))
            this._knownDead.push (victim);
    }
    removeKnownDeath (victim: User): void
    {
        this._knownDead = this._knownDead.filter (user => user != victim);
    }

    hasWon (winState: WinCondition): boolean
    {
        return this._team == Team.INNOCENT && winState == WinCondition.INNOCENT ||
               this._team == Team.TRAITOR  && winState == WinCondition.TRAITOR  ||
               this._faction == Faction.JESTER && winState == WinCondition.JESTER ||
               this._faction == Faction.SK     && winState == WinCondition.SK
    }

    dump (): string
    {
        return `Address: ${this._address}\n` +
               `Name:    ${this._name}\n` +
               `Team:    ${this._team}\n` +
               `Faction: ${this._faction}\n` +
               `Is dead: ${this._dead}`;
    }

    applyEffect (effect: Effect): void
    {
        this._effects.push (effect);
    }
    hasEffect (effect: Effect): boolean
    {
        return this._effects.includes (effect);
    }
    clearEffects (): void
    {
        this._effects = [];
    }
}



/* USERS */
export function addUser (address: Address, socket: any): User
{
    if (hasUser (address))
        getUser (address).connect (socket);
    else
        users[address] = new User (address, socket);

    return getUser (address);
}

export function hasUser (address: Address): boolean
{
    return users.hasOwnProperty (address);
}

export function getUser (address: Address): User
{
    if (!hasUser)
        return null;

    return users[address];
}

export function getAllUsers (): Array<User>
{
    return Object.keys (users).map (address => users[address]);
}

export function removeUser (address: Address): void // Currently doesn't inform anyone the user has disappeared if done mid-game
{
    delete users[address];
}

export function userCount (): number
{
    return Object.keys (users).length;
}

export function getNonSpectatingUsers (): Array<User>
{
    return getAllUsers ().filter (user => user.online && user.faction != Faction.SPECTATOR);
}
/* USERS END */



/* PLAYERS */
export function getPlayers (): Array<User>
{
    return Object.keys (users).filter (address => users[address].inGame).map (address => users[address]);
}

export function getPlayerNames (): Array<string>
{
    return getPlayers ().map (user => user.name);
}
export function getOtherPlayerNames (user: User): Array<string>
{
    return getPlayers ().filter (u => u != user).map (u => u.name);
}

export function getPublicPlayerData (): Array<object> // returns name and whether they're a spectator for each player
{
    return getAllUsers ().map (user => user.publicData);
}
export function getOtherPublicPlayerData (user: User): Array<object>
{
    return getAllUsers ().filter (u => u != null && u.address != user.address).map (u => u.publicData);
}

export function thereExistsPlayerWithName (name: string): boolean
{
    name = name.toLowerCase ();
    return getPlayers ().some (user => user.name.toLowerCase () == name);
}

export function getPlayerWithName (name: string): User
{
    if (name == null)
        return null;

    name = name.toLowerCase ();
    let results = getPlayers ().filter (user => user.name.toLowerCase () == name);

    if (results.length == 0)
        return null;
    return results[0];
}

export function getPlayersOfFaction (faction: Faction): Array<User>
{
    return getPlayers ().filter (user => user.faction == faction);
}

export function getPlayersOfTeam (team: Team): Array<User>
{
    return getPlayers ().filter (user => user.team == team);
}

export function getAllDead ()
{
    return getPlayers ().filter (user => user.isDead);
}
export function getAllLiving ()
{
    return getPlayers ().filter (user => !user.isDead);
}

export function resetPlayers ()
{
    getPlayers ().forEach (user => {
        user.reset ();
    });
}

export function revealAllInformationTo (user: User)
{
    let teamInfo = getPlayers ().map (user => {return {"name": user.name, "team": user.team};});
    let factionInfo = getPlayers ().map (user => {return {"name": user.name, "faction": user.faction};});
    let deathInfo = getPlayers ().map (user => {return {"name": user.name, "isDead": user.isDead};});

    user.emit ("revealTeams", teamInfo);
    user.emit ("revealFactions", factionInfo);
    user.emit ("revealMultipleDead", deathInfo);
}

export function revealAllInformation ()
{
    let teamInfo = getPlayers ().map (user => {return {"name": user.name, "team": user.team};});
    let factionInfo = getPlayers ().map (user => {return {"name": user.name, "faction": user.faction};});
    let deathInfo = getPlayers ().map (user => {return {"name": user.name, "isDead": user.isDead};});

    getPlayers ().forEach (user => {
        user.emit ("revealTeams", teamInfo);
        user.emit ("revealFactions", factionInfo);
        user.emit ("revealMultipleDead", deathInfo);
    });
}
/* PLAYERS END */



/* MESSAGES */
export function messageAllUsers (message: Message, storeInLog: boolean = true)
{
    getAllUsers ().forEach ((user, i) => {
        user.message (message, storeInLog);
    });
}

export function messageAllOtherUsers (user: User, message: Message, storeInLog: boolean = true)
{
    getAllUsers ().filter (u => u != user).forEach (u => {
        u.message (message, storeInLog);
    });
}

export function messageAllPlayers (message: Message, storeInLog: boolean = true)
{
    getPlayers ().forEach (user => {
        user.message (message, storeInLog);
    });
}

export function messageAllOtherPlayers (user: User, message: Message, storeInLog: boolean = true)
{
    getPlayers ().filter (u => u != user).forEach (u => {
        u.message (message, storeInLog);
    });
}

export function messageAllPlayersOfFaction (faction: Faction, message: Message, storeInLog: boolean = true)
{
    getPlayers ().filter (user => user.faction == faction).forEach (user => {
        user.message (message, storeInLog);
    });
}
/* MESSAGES END */



/* TEXT */
export function getFactionWinCon (faction: Faction): string
{
    if (faction == Faction.INNOCENT)
        return "You are innocent. Kill all traitors to win.";
    if (faction == Faction.TRAITOR)
        return "You are a traitor. Kill all non-traitors to win.";
    if (faction == Faction.DETECTIVE)
        return "You are a detective. Kill all traitors to win.";
    if (faction == Faction.JESTER)
        return "You are a jester. Be killed by a 'kill' card to win.";
    if (faction == Faction.SK)
        return "You are a serial killer. Kill all other players to win.";
}
/* TEXT END */



/* GAME LOGIC */
export enum GameState { NO_GAME, PRE_GAME, RUNNING, POST_GAME }
let gameState: GameState = GameState.NO_GAME;

let moves: Record<Address, Move> = {};
let turn: number = 0;

export interface Move
{
    source: User;
    target: User;
    card: Card;
}
function createMove (source: User, target: User, card: Card): Move
{
    return {
        "source": source,
        "target": target,
        "card": card
    };
}

export interface Result
{
    player: User;
    isDead: boolean;
    messages: Array<Message>;
}
function createResult (player: User, isDead: boolean): Result
{
    return {
        "player": player,
        "isDead": isDead,
        "messages": []
    };
}

export interface TurnData
{
    results: Record<Address, Result>,
    newDead: Array<User>
}

export function getGameState (): GameState
{
    return gameState;
}

export function getGameStateString (): string
{
    switch (gameState)
    {
        case GameState.NO_GAME:
            return "NO GAME";
        case GameState.PRE_GAME:
            return "PRE-GAME";
        case GameState.RUNNING:
            return "RUNNING";
        case GameState.POST_GAME:
            return "POST-GAME";
    }
}

export function gameIsActive (): boolean
{
    return gameState != GameState.NO_GAME;
}

export function gameIsInProgress (): boolean
{
    return gameState == GameState.RUNNING;
}

export function getTurn (): number
{
    return turn;
}

export function startPregame (): void
{
    gameState = GameState.PRE_GAME;
}

export function startGame (): void
{
    gameState = GameState.RUNNING;
    turn = 0;
    resetPlayers ();

    // Add all connected, non-spectating users to the game as players
    getNonSpectatingUsers ().forEach (user => {
        user.addToGame ();
    });

    let allPlayers: Array<User> = getPlayers ();

    let traitorCount = Math.ceil (config.settings.TRAITOR_FRACTION * allPlayers.length + config.settings.TRAITOR_CONSTANT);
    let detectiveCount = Math.floor (config.settings.DETECTIVE_FRACTION * allPlayers.length + config.settings.DETECTIVE_CONSTANT);

    let jesterCount = 0, skCount = 0;
    if (config.settings.ANARCHIST_THRESHOLD <= allPlayers.length && Math.random () < config.settings.ANARCHIST_PROBABILITY)
    {
        let anarchists: Array<Faction> = [];
        if (config.settings.JESTER_ENABLED)
            anarchists.push (Faction.JESTER);
        if (config.settings.SK_ENABLED)
            anarchists.push (Faction.SK);

        let anarchist = util.choose (anarchists);

        switch (anarchist)
        {
            case Faction.JESTER:
                jesterCount = 1;
            break;

            case Faction.SK:
                skCount = 1;
            break;
        }
    }

    let innocentCount = Math.max (0, allPlayers.length - traitorCount - detectiveCount - jesterCount - skCount);

    let roleDeck = cards.generateRoleDeck (innocentCount, traitorCount, detectiveCount, jesterCount, skCount);

    allPlayers.forEach (user => {
        let roleCard = roleDeck.pop ();
        user.clearHand ();
        user.drawCard (roleCard);
        user.faction = roleCard.faction;
        user.team = roleCard.team;

        user.drawCard (drawFromFactionDeck (roleCard.faction));
        user.drawCard (drawFromFactionDeck (roleCard.faction));
    });
}

export function endGame (): void
{
    gameState = GameState.POST_GAME;

    getPlayers ().forEach (user => {
        user.clearHand ();
    });
}

export function stopGame (): void
{
    gameState = GameState.NO_GAME;

    getPlayers ().forEach (user => {
        user.reset ();
    });
}

export function startTurn (): void
{
    turn++;
    moves = {};

    getPlayers ().forEach (user => {
        if (user.isDead)
        {
            user.drawCard (cards.getDeadCard ());
        }
        else
        {
            user.drawCard (drawFromFactionDeck (user.faction));
        }
    });
}

export function attemptMove (source: User, target: User, card: Card): string
{
    if (moves.hasOwnProperty (source.address))
    {
        return "You have already played a card this turn.";
    }
    else if (source.isDead && !(card instanceof DeadCard))
    {
        return "You are dead; you must play your DEAD card.";
    }
    else if (card instanceof RoleCard)
    {
        return "You cannot play your ID card.";
    }
    else if (card.targetType == TargetType.UNPLAYABLE)
    {
        return "This is not a playable card.";
    }
    else if (card.targetType == TargetType.PLAYER && target == null)
    {
        return "This card needs a target player.";
    }
    else if (card.targetType == TargetType.NO_TARGET && target != null)
    {
        return "This card does not target a player.";
    }
    else if (target != null && (target.team == Team.NONE || target.team == Team.SPECTATOR))
    {
        return "This player is not in the current game.";
    }
    else if (!source.hasCard (card))
    {
        return "You do not have this card in hand. If this is an unexpected result, please report this error.";
    }

    moves[source.address] = createMove (source, target, card);
    return null;
}

export function allPlayersHaveMoved (): boolean
{
    return getPlayers ().every (user => user.isBot || moves.hasOwnProperty (user.address));
}

export function randomiseRemainingMoves (): void
{
    getPlayers ().filter (user => !moves.hasOwnProperty (user.address)).forEach (user => {
        let target: User, card: Card;
        if (user.isDead)
        {
            card = cards.getDeadCard ();
        }
        else
        {
            card = util.shuffle (user.getCards ().filter (c => !(c instanceof RoleCard)))[0] as Card;
        }

        target = (card.targetType != TargetType.PLAYER) ? null : util.shuffle (getPlayers ().filter (t => t != user))[0];

        moves[user.address] = createMove (user, target, card);
        user.removeCardFromHand (card);

        user.message (createMessage (null, "You did not perform an action in time, so your action was performed randomly."));
        user.message (createMessage (null, (target != null) ? `You played ${card.title} on ${target.name}.` : `You played ${card.title}.`));
        user.emit ("forcePlay", {"card": card.json, "target": (target != null) ? target.name : null});
    });
}

export function getResultsOfTurn (): TurnData
{
    let results: Record<Address, Result> = {};
    let killed: Array<User> = [];

    let allPlayers: Array<User> = getPlayers ();

    // Set up initial state of each player
    allPlayers.forEach (user => {
        results[user.address] = createResult (user, user.isDead);
    });

    // Jails must be determined first
    allPlayers.forEach (user => {
        let move: Move = moves[user.address];
        let targetsMove: Move = (move.target != null) ? moves[move.target.address] : null;

        if (move.card.title == cards.jailTitle)
        {
            if (targetsMove.card.title != cards.jailTitle)
            {
                results[user.address].messages.push (createMessage (null, "Your action was ineffective.", "info"));
            }
            else
            {
                targetsMove.card = cards.getNullCard ();
                targetsMove.target = null;
                results[move.target.address].messages.push (createMessage (null, "Your action was ineffective.", "info"));
            }
        }
    });

    // Perform remaining moves in a random order
    util.shuffle (Object.keys (moves)).forEach (address => {
        let move: Move = moves[address];
        let source: User = move.source;
        let target: User = move.target;
        let targetsMove: Move = (move.target != null) ? moves[move.target.address] : null;
        let result: Result = results[move.source.address];
        let targetsResult: Result = (move.target != null) ? results[target.address] : null;

        switch (move.card.title)
        {
            case cards.witnessTitle:
                // See visits involving the target
                let visited = targetsMove.target;
                let visitors = getPlayers ().filter (user => user != source && moves[user.address].target == target);

                let r1 = (visited == null)        ? `${target.name} did not visit anyone.` :
                         (visited == move.source) ? `${target.name} visited you.` :
                                                    `${target.name} visited ${visited.name}.`;
                let r2 = (visitors.length > 0) ? `${target.name} was visited by ${util.formatList (visitors.map (user => user.name))}.` :
                                                 `Nobody else visited ${target.name}.`;

                result.messages.push (createMessage (null, r1, "info"));
                result.messages.push (createMessage (null, r2, "info"));

                // Respond to kills/death
                if (target.isDead)
                {
                    result.messages.push (createMessage (null, `${target.name} was already dead before you found them.`, "info"));
                    logDeath (source, target, true);
                }
                else
                {
                    // Correct fake death claims on being proved false
                    logDeath (source, target, false);

                    // Detect direct kills involving the target
                    let killers: Array<User> = getPlayers ().filter (user =>
                        moves[user.address].target == target &&
                        moves[user.address].card.title == cards.killTitle &&
                        !(targetsMove.target == user && targetsMove.card.title == cards.killTitle)
                    );
                    let victims: Array<User> =
                        (targetsMove.card.title == cards.killTitle) ? [targetsMove.target] :
                        (targetsMove.card.title == cards.c4Title  ) ? getPlayers ().filter (u => moves[u.address].target == target) :
                        [];
                    let deadVictims = victims.filter (u => u.isDead);

                    // Log deaths
                    if (killers.length > 0)
                        logDeath (source, target, true);
                    victims.forEach (victim => {
                        logDeath (source, victim, true);
                    });

                    if (killers.length > 0)
                        result.messages.push (createMessage (null, `${target.name} was killed by ${util.formatList (killers.map (u => u.name))}.`, "info"));
                    if (victims.length > 0)
                    {
                        result.messages.push (createMessage (null, `${target.name} killed ${util.formatList (victims.map (u => (u == source) ? "you" : u.name))}.`, "info"));
                    }
                    if (deadVictims.length > 0)
                    {
                        result.messages.push (createMessage (null, `${util.formatList (victims.map (u => (u == source) ? "you" : u.name))} were already dead.`, "info"));
                    }
                }
            break;

            case cards.killTitle:
                if (targetsMove.card.title == cards.killTitle && targetsMove.target == move.source)
                {
                    result.messages.push (createMessage (null, "Your action was ineffective.", "info"));
                }
                else
                {
                    let response = (target.isDead) ? `${target.name} is already dead.` : `You killed ${target.name}.`;
                    result.messages.push (createMessage (null, response, "info"));
                    logDeath (source, target, true);

                    if (!targetsResult.isDead)
                    {
                        targetsResult.isDead = true;
                        targetsResult.messages.push (createMessage (null, "You have been killed.", "info"));
                        killed.push (target);

                        target.applyEffect (Effect.KILLED_BY_KILL);
                    }
                }
            break;

            case cards.ambushTitle:
                if (getPlayers ().filter (user => user != source && moves[user.address].target == target).length > 0)
                {
                    result.messages.push (createMessage (null, `Someone else visited ${target.name}.`, "info"));
                }
                else
                {
                    logDeath (source, target, true);

                    if (targetsResult.isDead)
                    {
                        result.messages.push (createMessage (null, `${target.name} is already dead.`, "info"));
                    }
                    else
                    {
                        result.messages.push (createMessage (null, `You killed ${target.name}.`, "info"));
                        logDeath (source, target, true);

                        targetsResult.isDead = true;
                        targetsResult.messages.push (createMessage (null, "You have been killed.", "info"));

                        killed.push (target);
                    }
                }
            break;

            case cards.deadTitle:
                targetsResult.messages.push (createMessage (null, `${move.source.name} informed you they are dead.`, "info"));
                logDeath (target, source, true);
            break;

            case cards.inspectTitle:
                let randomCard: ICard = util.choose<ICard> (target.getCards ());
                result.messages.push (createMessage (null, `You see that ${target.name} is holding ${randomCard.title}.`, "info"));
                result.messages.push (createMessage (null, `${randomCard.title} reads: '${randomCard.description}'.`, "info"));
            break;

            case cards.tamperTitle:
                if (target.isDead)
                {
                    target.clearHand ();
                    result.messages.push (createMessage (null, `You removed all cards left in ${target.name}'s hand.`, "info"));
                    targetsResult.messages.push (createMessage (null, `Someone removed all cards from your hand.`, "info"));
                    logDeath (source, target, true);
                }
                else
                {
                    result.messages.push (createMessage (null, "Your action was ineffective.", "info"));
                }
            break;

            case cards.disguiseTitle:
            break;

            case cards.c4Title:
                let victims = getPlayers ().filter (user => moves[user.address].target == move.source);
                victims.forEach (victim => {
                    if (!results[victim.address].isDead)
                    {
                        results[victim.address].isDead = true;
                        results[victim.address].messages.push (createMessage (null, "You have been blown up.", "info"));
                        killed.push (victim);
                    }

                    logDeath (source, victim, true);
                });

                if (victims.length > 0)
                    result.messages.push (createMessage (null, `You blew up ${util.formatList (victims.map (v => v.name))}.`, "info"));
                else
                    result.messages.push (createMessage (null, "You did not blow anyone up.", "info"));
            break;

            case cards.playDeadTitle:
                result.messages.push (createMessage (null, `You falsely informed ${target.name} you are dead.`, "info"));
                targetsResult.messages.push (createMessage (null, `${move.source.name} informed you they are dead.`, "info"));
                logDeath (target, source, true);
            break;
        }
    });

    // Perform kills
    killed.forEach (user => {
        user.kill ();
    });

    return {"results": results, "newDead": killed};
}

export function checkWinConditions (): WinCondition
{
    let areTowniesAlive = getPlayersOfTeam (Team.INNOCENT).some (user => !user.isDead);
    let areTraitorsAlive = getPlayersOfTeam (Team.TRAITOR).some (user => !user.isDead);
    let areJestersAlive = getPlayersOfFaction (Faction.JESTER).some (user => !user.isDead);
    let areSKsAlive = getPlayersOfFaction (Faction.SK).some (user => !user.isDead);

    if (getPlayersOfFaction (Faction.JESTER).some (user => user.hasEffect (Effect.KILLED_BY_KILL)))
        return WinCondition.JESTER;
    else if (areTowniesAlive && !areTraitorsAlive && !areSKsAlive)
        return WinCondition.INNOCENT;
    else if (areTraitorsAlive && !areTowniesAlive && !areSKsAlive)
        return WinCondition.TRAITOR;
    else if (!areTowniesAlive && !areTraitorsAlive && areSKsAlive)
        return WinCondition.SK;
    else if (!areTowniesAlive && !areTraitorsAlive && !areSKsAlive)
        return WinCondition.DRAW;
    else
        return WinCondition.NONE;
}



function drawFromFactionDeck (faction: Faction): ICard
{
    if (faction == Faction.INNOCENT)
    {
        if (innocentDeck.length <= 0)
            innocentDeck = cards.generateInnocentDeck (1);
        return innocentDeck.pop ();
    }
    else if (faction == Faction.TRAITOR)
    {
        if (traitorDeck.length <= 0)
            traitorDeck = cards.generateTraitorDeck (1);
        return traitorDeck.pop ();
    }
    else if (faction == Faction.DETECTIVE)
    {
        if (detectiveDeck.length <= 0)
            detectiveDeck = cards.generateDetectiveDeck (1);
        return detectiveDeck.pop ();
    }
    else if (faction == Faction.JESTER)
    {
        if (jesterDeck.length <= 0)
            jesterDeck = cards.generateJesterDeck (1);
        return jesterDeck.pop ();
    }
    else if (faction == Faction.SK)
    {
        if (skDeck.length <= 0)
            skDeck = cards.generateSkDeck (1);
        return skDeck.pop ();
    }
}

function logDeath (witness: User, victim: User, isVictimDead: boolean): void
{
    if (isVictimDead)
    {
        witness.addKnownDeath (victim);
    }
    else
    {
        witness.removeKnownDeath (victim);
    }
}
/* GAME LOGIC END */
