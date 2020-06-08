let players = [];
let ARC_ANGLE = 330;
let ARC_RADIUS = 290;

function createPlayer (name, isActive)
{
    let jQueryRef = $(playerTempl.replace ("@name", name)).appendTo ($("#player-container"));
    let playerObject = new PlayerObject (jQueryRef, name);
    playerObject.setActive (isActive);
    players.push (playerObject);
    positionPlayers ();
    return playerObject;
}
function removePlayerAt (index)
{
    let oldPlayer = players[index];
    players = players.filter ((e, i) => i != index);
    for (let i = index; i < players.length; i++)
    {
        players[i].index--;
    }
    oldPlayer.jQueryRef.remove ();
    delete oldPlayer;
}
function resetPlayers ()
{
    for (i in players)
    {
        players[i].jQueryRef.remove ();
    }
    players = [];
}
function getPlayerWithName (name)
{
    if (name == null)
        return;

    name = name.toLowerCase ();
    const index = players.findIndex (p => p.name == name);

    if (index < 0)
        return null;

    return players[index];
}

function PlayerObject (jQueryRef, name)
{
    this.jQueryRef = jQueryRef;
    this.name = name.toLowerCase ();
    this.index = players.length;
    this.faction = "spectator";
    this.team = "spectator";

    /* POSITIONING */
    this.getPosition = () =>
    {
        let angle = ((this.index + 1) * ARC_ANGLE) / (players.length + 1);
        angle += 90 - ARC_ANGLE / 2;
        angle *= 0.0174533;

        let x = -ARC_RADIUS * Math.cos (angle);
        let y = ARC_RADIUS * Math.sin (angle);

        return [x, y];
    };
    this.setPosition = () =>
    {
        let [x, y] = this.getPosition ();

        this.jQueryRef.css ("left", x + "px");
        this.jQueryRef.css ("bottom", y + "px");
    }

    /* EVENTS */
    this.jQueryRef.click ((event) => {
        event.stopPropagation ();
        this.select ();
    });
    this.jQueryRef.mouseenter (() => {

    });
    this.jQueryRef.mouseleave (() => {

    });

    /* ACTIONS */
    this.select = () =>
    {
        let selectedCard = hand.selectedCard;
        if (selectedCard)
        {
            socket.off ("success");
            socket.off ("failure");
            socket.on ("success", () => {
                selectedCard.sendToPlayer (this);
                hand.remove (selectedCard);
                hand.selectedCard = null;
                hand.positionCards ();
                playSFX ("cardPlay");
            });
            socket.on ("failure", () => {
                hand.selectedCard = null;
                hand.positionCards ();
                playSFX ("cardReturn");
            });
            socket.emit ("attemptPlay", selectedCard.cardInfo, this.name);
        }
    };

    this.setTeam = (team) =>
    {
        this.team = team;

        let isInactive = this.jQueryRef.hasClass ("inactive");
        let isDead = this.jQueryRef.hasClass ("dead");

        this.jQueryRef.attr ("class", "player");
        this.jQueryRef.addClass (team.toLowerCase ());

        if (isInactive)
            this.jQueryRef.addClass ("inactive");
        if (isDead)
            this.jQueryRef.addClass ("dead");

        return this;
    }
    this.setFaction = (faction) =>
    {
        faction = faction.toLowerCase ();

        $.ajax ({
            url: `static/img/icon/${faction}.png`,
            type: "HEAD",
            error: () => {
                faction = "unknown";
                this.faction = faction;
                this.jQueryRef.find (".icon").attr ("src", `static/img/icon/${faction}.png`);
                this.jQueryRef.find (".icon").attr ("class", "icon");
                this.jQueryRef.find (".icon").addClass (faction);
            },
            success: () => {
                this.faction = faction;
                this.jQueryRef.find (".icon").attr ("src", `static/img/icon/${faction}.png`);
                this.jQueryRef.find (".icon").attr ("class", "icon");
                this.jQueryRef.find (".icon").addClass (faction);
            }
        });
    }
    this.setActive = (isActive) =>
    {
        if (isActive)
            this.jQueryRef.removeClass ("inactive");
        else if (!this.jQueryRef.hasClass ("inactive"))
            this.jQueryRef.addClass ("inactive")
        return this;
    }
    this.setDead = (isDead) =>
    {
        if (!isDead)
            this.jQueryRef.removeClass ("dead");
        else if (!this.jQueryRef.hasClass ("dead"))
            this.jQueryRef.addClass ("dead")
        return this;
    }
}

function positionPlayers ()
{
    for (let i = 0; i < players.length; i++)
    {
        players[i].setPosition (i);
    }
}

function revealTeamOf (name, team)
{
    let player = getPlayerWithName (name);

    if (player)
        player.setTeam (team);
}

function revealFactionOf (name, faction)
{
    let player = getPlayerWithName (name);

    if (player)
        player.setFaction (faction);
}

function setPlayerIsDead (name, isDead)
{
    let player = getPlayerWithName (name)

    if (player)
        player.setDead (isDead);
}

function resetFactions ()
{
    players.forEach ((player, i) => {
        player.setFaction ("");
    });
}
