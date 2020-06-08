const CARD_ASPECT = 7/5;
const HAND_MAX_WIDTH = 20;
const CARD_MAX_SEPARATION = 10;
const CARD_MAX_ANGLE = 40;
const CARD_WIDTH_IN_HAND = 8.5;
const CARD_WIDTH_SELECTED = 14;



function createCardHTML (cardInfo)
{
    let bg = `static/img/card/bg/${cardInfo.title.toLowerCase ()}.png`;

    return cardTempl.replace ("@title", cardInfo.title).replace ("@description", cardInfo.description).replace ("@bg", bg);
}

function createCard (cardInfo)
{
    return $(createCardHTML (cardInfo));
}

function createCardObject (cardInfo)
{
    let jQueryRef = createCard (cardInfo).appendTo ($("#hand"));
    return new CardObject (jQueryRef, cardInfo);
}

function playerToCardSpace (playerPos)
{
    let x = playerPos[0] + $(document).width () / 2;
    let y = playerPos[1] + $(document).height () * (0.99) - $("#players").height () / 2;

    return [x, y];
}



function CardObject (jQueryRef, cardInfo)
{
    this.jQueryRef = jQueryRef;
    this.cardInfo = cardInfo;

    /* TRANSFORMATIONS */
    this.setPos = (x, y, animated = true) =>
    {
        if (animated)
        {
            this.jQueryRef.addClass ("moving");
            setTimeout (() => {this.jQueryRef.removeClass ("moving");}, 100);
        }

        this.jQueryRef.css ("left", x);
        this.jQueryRef.css ("bottom", y);
    };
    this.setRot = (angle) =>
    {
        this.jQueryRef.css ({"transform": `translate(-50%, 50%) rotate(${angle}deg)`});
    };
    this.setWidth = (width) =>
    {
        this.jQueryRef.css ("width", width + "vw");
        this.jQueryRef.css ("border-radius", (width * 0.156) + "vw");
        this.jQueryRef.children ().css ("font-size", (0.08 * width) + "vw");
    };
    this.setHeight = (height) =>
    {
        this.setWidth (height / CARD_ASPECT);
    };

    /* EVENTS */
    this.jQueryRef.click ((event) => {
        event.stopPropagation ();
        this.select ();
    });
    this.jQueryRef.mouseenter (() => {

    });
    this.jQueryRef.mouseleave (() => {

    });

    /* ACTIONS */
    this.select = () =>
    {
        if (hand.selectedCard == this)
        {
            hand.selectedCard = null;
            playSFX ("cardReturn");
        }
        else
        {
            hand.selectedCard = this;
            playSFX ("cardSelect");
        }
        hand.positionCards ();
    };
    this.forceToBeSelected = () =>
    {
        hand.selectedCard = this;
        hand.positionCards ();
    };

    this.placeInSelectionArea = (animated = true) =>
    {
        this.setPos ($(document).width () / 2, $(document).height () / 2, animated);
        this.setRot (0);
        this.setWidth (CARD_WIDTH_SELECTED);
    }
    this.placeInHand = (handIndex, animated = true) =>
    {
        let separation = Math.min (CARD_MAX_SEPARATION, HAND_MAX_WIDTH / (hand.cards.length - 1));

        let x = handIndex - (hand.cards.length)/2 + 1/2;
        let y = 1 - ((x == 0) ? separation / 10 : Math.abs (x*separation) / 7); // Bleurgh

        this.setPos ((50 + x * separation) + "vw", y + "vw", animated);
        this.setRot (2 * CARD_MAX_ANGLE * x / HAND_MAX_WIDTH);
        this.setWidth (CARD_WIDTH_IN_HAND);
    };
    this.sendToPlayer = (playerObject, animated = true) =>
    {
        let [x, y] = playerToCardSpace (playerObject.getPosition ());
        this.setPos (x, y, animated);
        this.setRot (0);
        this.setWidth (0);

        setTimeout (() => {this.jQueryRef.remove ();}, 5000);
    };
    this.sendToNoOne = (animated = true) =>
    {
        this.setPos ($(document).width () / 2, $(document).height () / 2, animated);
        this.setRot (0);
        this.setWidth (0);

        setTimeout (() => {this.jQueryRef.remove ();}, 5000);
    }

    this.isSelected = () =>
    {
        return this == hand.selectedCard;
    };
}
