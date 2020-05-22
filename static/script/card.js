let CARD_ASPECT = 7/5;



function createCard (cardInfo)
{
    let jQueryRef = $(cardTempl.replace ("@title", cardInfo.title).replace ("@description", cardInfo.description)).appendTo ($("#toolbar-box"));
    return new CardObject (jQueryRef, cardInfo);
}



function CardObject (jQueryRef, cardInfo)
{
    this.jQueryRef = jQueryRef;
    this.cardInfo = cardInfo;

    /* TRANSFORMATIONS */
    this.setPos = (x, y) =>
    {
        this.jQueryRef.css ("left", x);
        this.jQueryRef.css ("bottom", y);
    };
    this.setRot = (angle) =>
    {
        this.jQueryRef.css ({'-webkit-transform' : 'rotate('+ angle + 'deg)',
                             '-moz-transform'    : 'rotate('+ angle + 'deg)',
                             '-ms-transform'     : 'rotate('+ angle + 'deg)',
                             'transform'         : 'rotate('+ angle + 'deg)'});
    };
    this.setWidth = (width) =>
    {
        this.jQueryRef.css ("width", width + "vw");
        this.jQueryRef.css ("padding-top", (width * CARD_ASPECT) + "vw");
        this.jQueryRef.css ("border-radius", (width * 0.156) + "vw");
        this.jQueryRef.children ().css ("font-size", (0.08 * width) + "vw");
    };
    this.setHeight = (height) =>
    {
        this.jQueryRef.css ("width", (height / CARD_ASPECT) + "vw");
        this.jQueryRef.css ("padding-top", height + "vw");
        this.jQueryRef.css ("border-radius", (height * 0.156 / CARD_ASPECT) + "vw");
        this.jQueryRef.children ().css ("font-size", (0.08 * height / CARD_ASPECT) + "vw");
    };

    /* EVENTS */
    this.jQueryRef.click ((event) => {
        event.stopPropagation ();
        this.select ();
        // this.sendToPlayer (players[0]);
    });
    this.jQueryRef.mouseenter (() => {

    });
    this.jQueryRef.mouseleave (() => {

    });

    /* ACTIONS */
    this.select = () =>
    {
        if (hand.selectedCard == this)
            hand.selectedCard = null;
        else
            hand.selectedCard = this;
        hand.positionCards ();
    };

    this.placeInSelectionArea = () =>
    {
        this.setPos ($(document).width () / 2, $(document).height () / 2);
        this.setWidth (14);
    }
    this.placeInHand = (handIndex) =>
    {
        this.setPos ((handIndex * 12.5 + 8) + "vw", "6.25vw");
        this.setWidth (8.5);
    };
    this.sendToPlayer = (playerObject) =>
    {
        let [x, y] = playerObject.getPosition ();
        this.setPos (x, y);
        this.setWidth (0);
    };
    this.sendToNoOne = () =>
    {
        this.setPos ($(document).width () / 2, $(document).height () / 2);
        this.setWidth (0);
    }

    this.isSelected = () =>
    {
        return this == hand.selectedCard;
    };
}
