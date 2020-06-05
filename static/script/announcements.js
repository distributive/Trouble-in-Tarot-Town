$(document).ready (function () {
    $("#turn-counter").hide ();

    $("form").submit (function (e) {
        e.preventDefault ();
        socket.emit ("attemptJoin", $("#join-menu input[type='text']").val ());
    });

    $("#open-rules").click (() => {
        showRules ();
    });
    $("#close-rules").click (() => {
        hideRules ();
    });

    $("#open-card-dex").click (() => {
        showCardDex ();
    });
    $("#close-card-dex").click (() => {
        hideCardDex ();
    });
});



function showTurnCount (turnNumber)
{
    // $("#turn-counter p").html ("Turn " + turnNumber);
    // $("#turn-counter").show (250, "swing");
    // setTimeout (() => {$("#turn-counter").hide (250, "swing")}, 2000);
}

function showEndGame (didWin)
{
    $("#turn-counter p").html ((didWin) ? "You won!" : "You lost");
    $("#turn-counter").show (250, "swing");
    setTimeout (() => {$("#turn-counter").hide (250, "swing")}, 2000);
}



function displayJoinMenu ()
{
    $("#join-menu").show ();
    showDimmer ();
}

function hideJoinMenu ()
{
    $("#join-menu").hide ();
    hideDimmer ();
}

function displayJoinMenuError (error)
{
    $("#join-menu input[type='text']").addClass ("error");
    $("#join-menu input[type='text']").attr ("Placeholder", error);
    $("#join-menu input[type='text']").val ("");
    $("#join-menu input[type='text']").click (function () {
        $(this).attr ("Placeholder", "Enter nickname...");
        $(this).removeClass ("error");
    });
}



function displayKilled ()
{
    showDimmer ();
    $("#killed").show ();
}

function hideKilled ()
{
    if ($("#killed").is (":visible"))
    {
        hideDimmer ();
        $("#killed").hide ();
    }
}



function displayAlreadyConnected ()
{
    $("#already-connected").show ();
}
