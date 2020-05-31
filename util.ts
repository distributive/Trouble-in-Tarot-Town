export function shuffle (array: Array<any>): Array<any>
{
    let result = array.slice ();

    let temp, randomIndex;
    for (let i = result.length - 1; i >= 0; i--)
    {
        randomIndex = Math.floor (Math.random () * result.length);

        temp = result[i];
        result[i] = result[randomIndex];
        result[randomIndex] = temp;
    }

    return result;
}

export function choose<T> (array: Array<T>): T
{
    return array[Math.floor (Math.random () * array.length)];
}

export function removeDuplicates (array: Array<any>): Array<any>
{
    return array.filter ((e, i) => array.indexOf (e) == i);
}

export function formatList (array: Array<any>): string
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

export function indentString (string: string, indent: string): string
{
    return (string + "").split ('\n').map (line => indent + line).join (`\n`);
}
