$(document).ready (function () {
    let updateHandle = setInterval (update, 100);
    $("body").click ((event) => backgroundClick (event));
    $(window).resize(() => onResize ());

    // Show players
    $("#players").show ();

    // Disable no-target button
    setNoTargetButton (false);

    // Scroll to the bottom of the message log
    $("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
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
    if (hand.selectedCard != null)
        playSFX ("cardReturn");

    hand.selectedCard = null;
    hand.positionCards ();

    hideKilled ();
}

function onResize ()
{
    $(".player").removeClass ("moving");
    hand.positionCards (false);
    positionPlayers ();
}
