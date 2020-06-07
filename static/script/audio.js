let effects = {};

let cardDrawSFX = [];
cardDrawSFX.push (new Audio ("static/audio/sfx/card_draw_1.mp3"));
cardDrawSFX.push (new Audio ("static/audio/sfx/card_draw_2.mp3"));
cardDrawSFX.push (new Audio ("static/audio/sfx/card_draw_3.mp3"));
cardDrawSFX.push (new Audio ("static/audio/sfx/card_draw_4.mp3"));
effects["cardDraw"] = cardDrawSFX;

let cardPlaySFX = [];
cardPlaySFX.push (new Audio ("static/audio/sfx/card_play.mp3"));
effects["cardPlay"] = cardPlaySFX;

let cardReturnSFX = [];
cardReturnSFX.push (new Audio ("static/audio/sfx/card_return.mp3"));
effects["cardReturn"] = cardReturnSFX;

let cardSelectSFX = [];
cardSelectSFX.push (new Audio ("static/audio/sfx/card_return.mp3"));
effects["cardSelect"] = cardSelectSFX;

let cardShuffleSFX = [];
cardShuffleSFX.push (new Audio ("static/audio/sfx/card_shuffle.mp3"));
effects["cardShuffle"] = cardShuffleSFX;

let gameWinSFX = [];
gameWinSFX.push (new Audio ("static/audio/sfx/game_win.mp3"));
effects["gameWin"] = gameWinSFX;

let gameLoseSFX = [];
gameLoseSFX.push (new Audio ("static/audio/sfx/game_lose.mp3"));
effects["gameLose"] = gameLoseSFX;

let gameDeathSFX = [];
gameDeathSFX.push (new Audio ("static/audio/sfx/game_death.mp3"));
effects["gameDeath"] = gameDeathSFX;

function playRandom (effectPool)
{
    effectPool[Math.floor (Math.random () * effectPool.length)].play ();
}

function playSFX (effect)
{
    if (effects.hasOwnProperty (effect))
        playRandom (effects[effect]);
}
