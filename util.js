function shuffle (array) // Mutates input
{
    let temp, randomIndex;
    for (let i = array.length - 1; i >= 0; i--)
    {
        randomIndex = Math.floor (Math.random () * array.length);

        temp = array[i];
        array[i] = array[randomIndex];
        array[randomIndex] = temp;
    }

    return array;
}

function choose (array)
{
    return array[Math.floor (Math.random () * array.length)];
}

function formatList (array)
{
    if (array.length == 0)
        return "";
    else if (array.length == 1)
        return array[0] + "";
    else if (array.length == 2)
        return array[0] + " and " + array[1];
    else if (array.length == 3)
        return array[0] + ", " + array[1] + ", and " + array[2];
    else
        return array[0] + ", " + formatList (array.slice (1));
}

function indentString (string, indent)
{
    return (string + "").split ('\n').map (line => indent + line).join (`\n`);
}



module.exports = {
    shuffle,
    choose,
    formatList,
    indentString
};
