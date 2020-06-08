function setIcon (faction)
{
    faction = faction.toLowerCase ();

    if (faction == "none")
        faction = "spectator";

    $.ajax ({
        url: `static/img/character/${faction}.png`,
        type: "HEAD",
        error: () => {
            $("#player-faction").attr ("src", "");
            $("#player-faction").hide ();
        },
        success: () => {
            $("#player-faction").attr ("src", `static/img/character/${faction}.png`);
            $("#player-faction").show ();
        }
    });
}
