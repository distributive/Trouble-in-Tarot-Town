function setIcon (faction)
{
    faction = faction.toLowerCase ();
    if (faction == "innocent")
    {
        $("#icon img").attr("src", "static/img/iconInnocent.png");
        $("#icon img").show ();
    }
    else if (faction == "traitor")
    {
        $("#icon img").attr("src", "static/img/iconTraitor.png");
        $("#icon img").show ();
    }
    else if (faction == "detective")
    {
        $("#icon img").attr("src", "static/img/iconDetective.png");
        $("#icon img").show ();
    }
    else if (faction == "dead")
    {
        $("#icon img").attr("src", "static/img/iconDead.png");
        $("#icon img").show ();
    }
    else if (faction == "spectator")
    {
        $("#icon img").attr("src", "static/img/iconSpectator.png");
        $("#icon img").show ();
    }
    else if (faction == "unknown")
    {
        $("#icon img").attr("src", "static/img/iconUnknown.png");
        $("#icon img").show ();
    }
    else
    {
        $("#icon img").attr("src", "");
        $("#icon img").hide ();
    }
}
