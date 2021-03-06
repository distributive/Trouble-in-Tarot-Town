let path = window.location.pathname;
if (path[path.length - 1] == "/")
    path = path.slice (0, -1);

let socket = io ({ "path": `${path}/socket.io` });

/* MESSAGES */
socket.on ("message", (message) => {
    receiveMessage (message.sender, message.content, message.type);
});
/* MESSAGES END */



/* JOINING */
socket.on ("requestToken", (defaultToken) => {
    if (localStorage.token == null)
        localStorage.token = defaultToken;

    socket.emit ("connectWithToken", localStorage.token);
});

socket.on ("connected", () => {
    clearMessages ();
});

socket.on ("alreadyConnected", () => {
    displayAlreadyConnected ();
});

socket.on ("requestJoin", () => {
    displayJoinMenu ();
});

socket.on ("alreadyJoined", () => {
    hideDimmer ();
});

socket.on ("joinAccepted", (token) => {
    hideJoinMenu ();
});

socket.on ("joinError", (error) => {
    displayJoinMenuError (error);
});
/* JOINING END */



/* CARD DEX */
socket.on ("setCardDex", (cardDex) => {
    fillCardDex (cardDex);
});
/* CARD DEX END */



/* SET UI */
socket.on ("setName", (name) => {
    $("#player-name").html (name);
});

socket.on ("setPlayers", (otherPlayerData, isPlaying, gameIsRunning) => {
    // For now, just wipe all player objects and recreate new ones
    resetPlayers ();

    // Remove spectators if not spectating
    let otherPlayers = otherPlayerData.filter (player => !gameIsRunning || player.isActive);

    // Create player objects
    otherPlayers.forEach (player => {
        createPlayer (player.name, player.isActive);
    });

    let playerCount = otherPlayers.length + (isPlaying ? 1 : 0);
    $("#player-count").html (playerCount + " player" + ((playerCount > 1) ? "s" : "") + " in game.");
});

socket.on ("setFaction", (faction) => {
    setIcon (faction);
});

socket.on ("setIsDead", (isDead) => {
    if (isDead)
    {
        setIcon ("dead");
        displayKilled ();

        playSFX ("gameDeath");
    }
});

socket.on ("revealTeam", (name, team) => {
    revealTeamOf (name, team);
});

socket.on ("revealTeams", (array) => {
    array.forEach (data => {
        revealTeamOf (data.name, data.team);
    });
});

socket.on ("revealFaction", (name, faction) => {
    revealFactionOf (name, faction);
});

socket.on ("revealFactions", (array) => {
    array.forEach (data => {
        revealFactionOf (data.name, data.faction);
    });
});

socket.on ("revealIsDead", (data) => {
    setPlayerIsDead (data.name , data.isDead);
});

socket.on ("revealMultipleDead", (list) => {
    list.forEach((data, i) => {
        setPlayerIsDead (data.name , data.isDead);
    });

});

socket.on ("startTurn", (turnCount) => {
    showTurnCount (turnCount);
});

socket.on ("setTurnCountdown", (value) => {
    value = (value < 0) ? "" : value + "";
    $("#countdown p").html (value);
});
/* SET UI END */



/* GAMEPLAY */
socket.on ("startGame", () => {
    resetFactions ();
    playSFX ("cardShuffle");
});

socket.on ("drawCard", (card) => {
    drawCard (card);
    playSFX ("cardDraw");
});

socket.on ("setCards", (cards) => {
    hand.clear ();
    cards.forEach (card => {
        drawCard (card);
    });
    if (hand.length > 0)
    {
        playSFX ("cardDraw");
    }
});

socket.on ("forcePlay", (move) => {
    let cardObject = hand.getCardWithTitle (move.card.title);
    if (cardObject == null)
        return;

    let targetPlayer = getPlayerWithName (move.target);

    hand.selectedCard = null;

    if (targetPlayer)
        cardObject.sendToPlayer (targetPlayer);
    else
        cardObject.sendToNoOne (targetPlayer);

    hand.remove (cardObject);
    hand.positionCards ();
});

socket.on ("endGame", (didWin) => {
    showEndGame (didWin);
    hideKilled ();
});
/* GAMEPLAY END */
