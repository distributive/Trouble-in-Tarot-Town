function Hand (cards)
{
    this.cards = cards;
    this.selectedCard = null;

    this.add = (card) =>
    {
        this.cards.push (card);
    }
    this.removeAt = (index) =>
    {
        let oldCard = this.cards[index];
        this.cards = this.cards.filter ((e, i) => i != index);
        this.positionCards ();
        return oldCard;
    }
    this.remove = (cardObject) =>
    {
        this.cards = this.cards.filter ((e, i) => e != cardObject);
        this.positionCards ();
    }
    this.clear = () =>
    {
        this.cards.map (card => card.jQueryRef.remove ());
        this.cards = [];
    }
    this.getCardWithTitle = (title) =>
    {
        let cards = this.cards.filter (card => card.cardInfo.title == title);
        return (cards.length > 0) ? cards[0] : null;
    }

    /* UI */
    this.positionCards = (animated = true) =>
    {
        for (let i = 0; i < this.cards.length; i++)
        {
            if (this.cards[i] == this.selectedCard)
            {
                this.cards[i].placeInSelectionArea (animated);
            }
            else
            {
                this.cards[i].placeInHand (i, animated);
            }
        }

        // Enable/disable no-target button
        setNoTargetButton (hand.selectedCard != null);
    }
}



let hand = new Hand ([]);



function drawCard (card)
{
    let cardObject = createCardObject (card);
    hand.add (cardObject);
    hand.positionCards ();
}



function setNoTargetButton (isActive)
{
    if (isActive)
    {
        $("#no-target").removeClass ("inactive");

        $("#no-target").unbind ("click");
        $("#no-target").click (() => {
            let selectedCard = hand.selectedCard;
            if (selectedCard)
            {
                socket.off ("success");
                socket.off ("failure");
                socket.on ("success", () => {
                    selectedCard.sendToNoOne ();
                    hand.remove (selectedCard);
                    hand.selectedCard = null;
                    hand.positionCards ();
                });
                socket.on ("failure", () => {
                    hand.selectedCard = null;
                    hand.positionCards ();
                });
                socket.emit ("attemptPlay", selectedCard.cardInfo, null);
            }
        });
    }
    else
    {
        if (!$("#no-target").hasClass ("inactive"))
            $("#no-target").addClass ("inactive");

        $("#no-target").unbind ("click");
    }
}
