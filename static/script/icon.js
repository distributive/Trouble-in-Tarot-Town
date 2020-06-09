function setIcon (faction)
{
    faction = faction.toLowerCase ();

    if (faction == "none")
        faction = "spectator";

    $.ajax ({
        url: `static/img/character/${faction}.png`,
        type: "HEAD",
        error: () => {
            animateIcon (null);
        },
        success: () => {
            animateIcon (`static/img/character/${faction}.png`);
        }
    });
}

function animateIcon (img)
{
    $("#player-faction").attr ("class", "");
    $("#player-faction").css ("width", 0);
    $("#player-faction div").css ("opacity", 1);

    setTimeout (() => {
        if (img == null)
        {
            $("#player-faction img").attr ("src", "");
            $("#player-faction").hide ();
        }
        else
        {
            $("#player-faction img").attr ("src", img);
            $("#player-faction").show ();
        }

        $("#player-faction").attr ("class", "flip");
        $("#player-faction").css ("width", "100%");
        $("#player-faction div").css ("opacity", 0);

        setTimeout (() => {$("#player-faction").attr ("class", "");}, 1000);
    }, 1000);
}
