$(document).ready (function () {
    let updateHandle = setInterval (update, 100);
    $("body").click ((event) => backgroundClick (event));
    $(window).resize(() => onResize ());

    // Show players
    $("#players").show ();

    // Disable no-target button
    setNoTargetButton (false);

    hideRules ();
    hideCardDex ();

    // Scroll to the bottom of the message log
    $("#message-box")[0].scrollTop = $("#message-box")[0].scrollHeight;
});

function update ()
{
}

function showDimmer ()
{
    $("#dimmer").show ();
}
function hideDimmer ()
{
    $("#dimmer").hide ();
}

function backgroundClick (event)
{
    hand.selectedCard = null;
    hand.positionCards ();

    hideKilled ();
}

function onResize ()
{
    hand.positionCards ();
    positionPlayers ();
}
