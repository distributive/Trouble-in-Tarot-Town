import * as util from "./util";

export enum Faction { NONE, SPECTATOR, INNOCENT, TRAITOR, DETECTIVE }
export enum Team { NONE, SPECTATOR, INNOCENT, TRAITOR }
export enum TargetType { UNPLAYABLE = 0, PLAYER, NO_TARGET }

export abstract class ICard
{
    readonly title: string;
    readonly description: string;

    constructor (title: string, description: string)
    {
        this.title = title;
        this.description = description;
    }

    get json (): object
    {
        return {
            "title": this.title,
            "description": this.description
        };
    }

    abstract get isRoleCard (): boolean;
}
export class Card extends ICard
{
    readonly targetType: TargetType;

    constructor (title: string, description: string, targetType: TargetType)
    {
        super (title, description);
        this.targetType = targetType;

        cards[title] = this;
    }

    get isRoleCard (): boolean {return false;}
}
export class DeadCard extends Card
{
    constructor (title: string, description: string, targetType: TargetType)
    {
        super (title, description, targetType);
    }
}
export class RoleCard extends ICard
{
    readonly faction: Faction;
    readonly team: Team;

    constructor (title: string, description: string, faction: Faction, team: Team)
    {
        super (title, description);
        this.faction = faction;
        this.team = team;

        roleCards[title] = this;
    }

    get isRoleCard (): boolean {return true;}
}
export class NullCard extends Card
{
    constructor ()
    {
        super (nullTitle, "", TargetType.NO_TARGET);
    }

    get isRoleCard (): boolean {return false;}
}



export const innocentTitle: string = "Innocent";
const innocentDescription: string = "<b>ID:</b> you are <b><span class='good'>innocent</span></b>.";

export const traitorTitle: string = "Traitor";
const traitorDescription: string = "<b>ID:</b> you are a <b><span class='bad'>traitor</span></b>.";

export const detectiveTitle: string = "Detective";
const detectiveDescription: string = "<b>ID:</b> you are a <b><span class='detective'>detective</span></b>.";



export const deadTitle: string = "DEAD";
const deadDescription: string = "Target a player and inform them you are dead. You <b>must</b> play this card.";
const deadTargetted: TargetType = TargetType.PLAYER;

export const witnessTitle: string = "Witness";
const witnessDescription: string = "Target a player. See who they targetted, who targetted them, and if a kill involved them.";
const witnessTargetted: TargetType = TargetType.PLAYER;

export const killTitle: string = "Kill";
const killDescription: string = "Target a player. If they do not target you with a 'Kill' card back, they die.";
const killTargetted: TargetType = TargetType.PLAYER;

export const inspectTitle: string = "Inspect";
const inspectDescription: string = "Target a player. Privately reveal one of their cards at random.";
const inspectTargetted: TargetType = TargetType.PLAYER;

export const tamperTitle: string = "Tamper";
const tamperDescription: string = "Target a player. If they are dead, remove all of their cards from the game.";
const tamperTargetted: TargetType = TargetType.PLAYER;

export const disguiseTitle: string = "Disguise";
const disguiseDescription: string = "Next turn you do not show up to 'Witness' card effects.";
const disguiseTargetted: TargetType = TargetType.NO_TARGET;

export const c4Title: string = "C4";
const c4Description: string = "All players who target you this turn die.";
const c4Targetted: TargetType = TargetType.NO_TARGET;

export const playDeadTitle: string = "Play Dead";
const playDeadDescription: string = "Target a player and falsely inform them you are dead.";
const playDeadTargetted: TargetType = TargetType.PLAYER;

export const jailTitle: string = "Jail";
const jailDescription: string = "Target a player. Cancel their actions this turn; they do not visit anyone. Ineffective against other 'jail' cards.";
const jailTargetted: TargetType = TargetType.PLAYER;



export const nullTitle: string = "null";



const roleCards: Record<string, RoleCard> = {};
const cards: Record<string, Card> = {};



const cardInnocent  : RoleCard = new RoleCard (innocentTitle, innocentDescription, Faction.INNOCENT, Team.INNOCENT);
const cardTraitor   : RoleCard = new RoleCard (traitorTitle, traitorDescription, Faction.TRAITOR, Team.TRAITOR);
const cardDetective : RoleCard = new RoleCard (detectiveTitle, detectiveDescription, Faction.DETECTIVE, Team.INNOCENT);

const cardDead     : Card = new Card (deadTitle, deadDescription, deadTargetted);
const cardWitness  : Card = new Card (witnessTitle, witnessDescription, witnessTargetted);
const cardKill     : Card = new Card (killTitle, killDescription, killTargetted);
const cardInspect  : Card = new Card (inspectTitle, inspectDescription, inspectTargetted);
const cardTamper   : Card = new Card (tamperTitle, tamperDescription, tamperTargetted);
const cardDisguise : Card = new Card (disguiseTitle, disguiseDescription, disguiseTargetted);
const cardC4       : Card = new Card (c4Title, c4Description, c4Targetted);
const cardPlayDead : Card = new Card (playDeadTitle, playDeadDescription, playDeadTargetted);
const cardJail     : Card = new Card (jailTitle, jailDescription, jailTargetted);

const cardNull : NullCard = new NullCard ();



export function cardFromTitle (title: string): ICard
{
    let card: ICard = cards[title];

    if (card == null)
        card = roleCards[title];

    return card;
}



export function generateRoleDeck (innocentCount, traitorCount, detectiveCount, shuffled = true): Array<RoleCard>
{
    let roleDeck = [].concat (
        Array (innocentCount).fill (cardInnocent),
        Array (traitorCount).fill (cardTraitor),
        Array (detectiveCount).fill (cardDetective)
    );

    if (shuffled)
        roleDeck = util.shuffle (roleDeck);

    return roleDeck;
}

export function generateInnocentDeck (innocentCount, shuffled = true): Array<Card>
{
    let deck = [].concat (
        Array (9 * innocentCount).fill (cardWitness),
        Array (4 * innocentCount).fill (cardKill)
    );

    if (shuffled)
        deck = util.shuffle (deck);

    return deck;
}

export function generateTraitorDeck (traitorCount, shuffled = true): Array<Card>
{
    let deck = [].concat (
        Array (4 * traitorCount).fill (cardWitness),
        Array (4 * traitorCount).fill (cardKill),
        Array (2 * traitorCount).fill (cardTamper),
        Array (2 * traitorCount).fill (cardC4),
        Array (    traitorCount).fill (cardPlayDead)
    );

    if (shuffled)
        deck = util.shuffle (deck);

    return deck;
}

export function generateDetectiveDeck (detectiveCount, shuffled = true): Array<Card>
{
    let deck = [].concat (
        Array (5 * detectiveCount).fill (cardWitness),
        Array (4 * detectiveCount).fill (cardKill),
        Array (3 * detectiveCount).fill (cardInspect),
        Array (    detectiveCount).fill (cardJail)
    );

    if (shuffled)
        deck = util.shuffle (deck);

    return deck;
}

export function getDeadCard (): DeadCard
{
    return cardDead;
}

export function getNullCard (): NullCard
{
    return cardNull;
}

export function getCardDex ()
{
    return [
        {
            header: "ID cards",
            description: "Available roles:",
            cards: util.removeDuplicates (generateRoleDeck (1, 1, 1, false)).map (card => card.json)
        },
        {
            header: "Innocent cards",
            description: "Cards available to innocents:",
            cards: util.removeDuplicates (generateInnocentDeck (1, false)).map (card => card.json)
        },
        {
            header: "Traitor cards",
            description: "Cards available to traitors:",
            cards: util.removeDuplicates (generateTraitorDeck (1, false)).map (card => card.json)
        },
        {
            header: "Detective cards",
            description: "Cards available to detectives:",
            cards: util.removeDuplicates (generateDetectiveDeck (1, false)).map (card => card.json)
        },
        {
            header: "Dead card",
            description: "When you are dead, you only draw this card. Every turn you must target another player with it:",
            cards: util.removeDuplicates ([getDeadCard ()])
        }
    ];
}
