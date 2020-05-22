let socket = io ();
let token = "";

/* MESSAGES */
socket.on ("message", (content) => {
    if (content.divider)
        splitMessages ();

    receiveMessage (content.sender, content.message);
});
/* MESSAGES END */



/* JOINING */
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



/* SET UI */
socket.on ("setName", (name) => {
    $("#player-name").html ("You are: <b>" + name + "</b>");
});

socket.on ("setPlayers", (data) => {
    // For now, just wipe all player objects and recreate new ones
    resetPlayers ();

    // Remove spectators if not spectating
    let otherPlayers = data.otherPlayers.filter (player => !data.gameIsRunning || player.isActive);

    // Create player objects
    otherPlayers.forEach((player, i) => {
        createPlayer (player.name, player.isActive);
    });

    let playerCount = otherPlayers.length + ((data.isPlaying) ? 1 : 0);
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
    }
})

socket.on ("revealTraitors", (names) => {
    revealTraitors (names);
});

socket.on ("revealFaction", (data) => {
    revealFactionOf (data.name, data.faction);
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
});

socket.on ("drawCard", (card) => {
    drawCard (card);
});

socket.on ("setCards", (cards) => {
    hand.clear ();
    cards.forEach((card, i) => {
        drawCard (card);
    });
});

socket.on ("endGame", (didWin) => {
    showEndGame (didWin);
    hideKilled ();
});
/* GAMEPLAY END */
