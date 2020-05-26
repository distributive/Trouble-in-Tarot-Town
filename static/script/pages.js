function showRules ()
{
    $("#rules").show ();
}
function hideRules ()
{
    $("#rules").hide ();
}

function fillCardDex (cardDex)
{
    $("#cards").empty ();

    cardDex.forEach ((faction, i) => {
        let cards = "";
        faction.cards.forEach ((card, i) => {
            cards += createCardHTML (card);
        });

        $(cardDexEntryTempl.replace ("@header", faction.header).replace ("@description", faction.description).replace ("@cards", cards)).appendTo ($("#cards"));
    });
}

function showCardDex ()
{
    $("#card-dex").show ();
}
function hideCardDex ()
{
    $("#card-dex").hide ();
}
