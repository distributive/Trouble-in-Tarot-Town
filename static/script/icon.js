function setIcon (faction)
{
    faction = faction.toLowerCase ();
    if (faction == "innocent")
    {
        $("#player-faction").attr("src", "static/img/iconInnocent.png");
        $("#player-faction").show ();
    }
    else if (faction == "traitor")
    {
        $("#player-faction").attr("src", "static/img/iconTraitor.png");
        $("#player-faction").show ();
    }
    else if (faction == "detective")
    {
        $("#player-faction").attr("src", "static/img/iconDetective.png");
        $("#player-faction").show ();
    }
    else if (faction == "dead")
    {
        $("#player-faction").attr("src", "static/img/iconDead.png");
        $("#player-faction").show ();
    }
    else if (faction == "spectator")
    {
        $("#player-faction").attr("src", "static/img/iconSpectator.png");
        $("#player-faction").show ();
    }
    else if (faction == "unknown")
    {
        $("#player-faction").attr("src", "static/img/iconUnknown.png");
        $("#player-faction").show ();
    }
    else
    {
        $("#player-faction").attr("src", "");
        $("#player-faction").hide ();
    }
}
