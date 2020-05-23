let util = require ("./util.js");

function Card (title, description, targetted)
{
    this.title = title;
    this.description = description;
    this.targetted = targetted;

    cards[title] = this;
}
function RoleCard (title, description, faction, team)
{
    this.title = title;
    this.description = description;
    this.faction = faction;
    this.team = team;

    roleCards[title] = this;
}
function NullCard ()
{
    this.title = nullTitle;
    this.description = "";
    this.targetted = false;
}



const innocentTitle = "Innocent";
const innocentDescription = "<b>ID:</b> you are <b><span class='good'>innocent</span></b>.";

const traitorTitle = "Traitor";
const traitorDescription = "<b>ID:</b> you are a <b><span class='bad'>traitor</span></b>.";

const detectiveTitle = "Detective";
const detectiveDescription = "<b>ID:</b> you are a <b><span class='detective'>detective</span></b>.";



const deadTitle = "DEAD";
const deadDescription = "Target a player and inform them you are dead. You <b>must</b> play this card.";
const deadTargetted = true;

const witnessTitle = "Witness";
const witnessDescription = "Target a player. See who they targetted, who targetted them, and if a kill involved them.";
const witnessTargetted = true;

const killTitle = "Kill";
const killDescription = "Target a player. If they do not target you with a 'Kill' card back, they die.";
const killTargetted = true;

const inspectTitle = "Inspect";
const inspectDescription = "Target a player. Privately reveal one of their cards at random.";
const inspectTargetted = true;

const tamperTitle = "Tamper";
const tamperDescription = "Target a player. If they are dead, remove all of their cards from the game.";
const tamperTargetted = true;

const disguiseTitle = "Disguise";
const disguiseDescription = "Next turn you do not show up to 'Witness' card effects.";
const disguiseTargetted = false;

const c4Title = "C4";
const c4Description = "All players who target you this turn die.";
const c4Targetted = false;

const playDeadTitle = "Play Dead";
const playDeadDescription = "Target a player and falsely inform them you are dead.";
const playDeadTargetted = true;

const jailTitle = "Jail";
const jailDescription = "Target a player. Cancel their actions this turn; they do not visit anyone. Ineffective against other 'jail' cards.";
const jailTargetted = true;



const nullTitle = "null";



let roleCards = {};
let cards = {};

const cardInnocent = new RoleCard (innocentTitle, innocentDescription, "innocent", "innocent");
const cardTraitor = new RoleCard (traitorTitle, traitorDescription, "traitor", "traitor");
const cardDetective = new RoleCard (detectiveTitle, detectiveDescription, "detective", "innocent");

const cardDead = new Card (deadTitle, deadDescription, deadTargetted);
const cardWitness = new Card (witnessTitle, witnessDescription, witnessTargetted);
const cardKill = new Card (killTitle, killDescription, killTargetted);
const cardInspect = new Card (inspectTitle, inspectDescription, inspectTargetted);
const cardTamper = new Card (tamperTitle, tamperDescription, tamperTargetted);
const cardDisguise = new Card (disguiseTitle, disguiseDescription, disguiseTargetted);
const cardC4 = new Card (c4Title, c4Description, c4Targetted);
const cardPlayDead = new Card (playDeadTitle, playDeadDescription, playDeadTargetted);
const cardJail = new Card (jailTitle, jailDescription, jailTargetted);

const cardNull = new NullCard ();



function generateRoleDeck (innocentCount, traitorCount, detectiveCount)
{
    let roleDeck = util.shuffle ([].concat (
        Array (innocentCount).fill ().map (_ => cardInnocent),
        Array (traitorCount).fill ().map (_ => cardTraitor),
        Array (detectiveCount).fill ().map (_ => cardDetective)
    ));

    return roleDeck;
}

function generateInnocentDeck (innocentCount)
{
    let deck = util.shuffle ([].concat (
        Array (9 * innocentCount).fill ().map (_ => cardWitness),
        Array (4 * innocentCount).fill ().map (_ => cardKill)
    ));

    return deck;
}

function generateTraitorDeck (traitorCount)
{
    let deck = util.shuffle ([].concat (
        Array (4 * traitorCount).fill ().map (_ => cardWitness),
        Array (4 * traitorCount).fill ().map (_ => cardKill),
        Array (2 * traitorCount).fill ().map (_ => cardTamper),
        Array (2 * traitorCount).fill ().map (_ => cardC4),
        Array (    traitorCount).fill ().map (_ => cardPlayDead)
    ));

    return deck;
}

function generateDetectiveDeck (detectiveCount)
{
    let deck = util.shuffle ([].concat (
        Array (5 * detectiveCount).fill ().map (_ => cardWitness),
        Array (4 * detectiveCount).fill ().map (_ => cardKill),
        Array (3 * detectiveCount).fill ().map (_ => cardInspect),
        Array (    detectiveCount).fill ().map (_ => cardJail)
    ));

    return deck;
}

function getDeadCard ()
{
    return cardDead;
}

function isIdCard (card)
{
    return card.hasOwnProperty ("faction");
}

function isIdCardTitle (cardTitle)
{
    return cardTitle == innocentTitle || cardTitle == traitorTitle || cardTitle == detectiveTitle;
}

function isDeadCard (card)
{
    return card.title == deadTitle;
}

function isDeadCardTitle (cardTitle)
{
    return cardTitle == deadTitle;
}

function isTargettedTitle (cardTitle)
{
    if (!cards.hasOwnProperty (cardTitle))
        return null;

    return cards[cardTitle].targetted;
}



module.exports = {
    innocentTitle,
    traitorTitle,
    detectiveTitle,
    deadTitle,
    witnessTitle,
    killTitle,
    inspectTitle,
    tamperTitle,
    disguiseTitle,
    c4Title,
    playDeadTitle,
    jailTitle,

    nullTitle,

    generateRoleDeck,
    generateInnocentDeck,
    generateTraitorDeck,
    generateDetectiveDeck,
    getDeadCard,
    isIdCard,
    isIdCardTitle,
    isDeadCard,
    isDeadCardTitle,
    isTargettedTitle
};
