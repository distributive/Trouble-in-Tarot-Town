function receiveMessage (sender, content)
{
    // Check if scrolled to the bottom of the messages
    let doScroll = $("#message-box")[0].scrollTop + $("#message-box").innerHeight () >= $("#message-box")[0].scrollHeight;

    // Add new message
    if (sender)
        $(messageTempl.replace ("@sender", sender).replace ("@content", content)).appendTo ($("#message-box"));
    else
        $(statementTempl.replace ("@content", content)).appendTo ($("#message-box"));

    // If scrolled to the bottom of the messages, fix scroll height to the bottom of the messages
    if (doScroll)
        $("#message-box")[0].scrollTop = $("#message-box")[0].scrollHeight;
}

function splitMessages ()
{
    // Check if scrolled to the bottom of the messages
    let doScroll = $("#message-box")[0].scrollTop + $("#message-box").innerHeight () >= $("#message-box")[0].scrollHeight;

    // Add new divider
    $("<hr>").appendTo ($("#message-box"));

    // If scrolled to the bottom of the messages, fix scroll height to the bottom of the messages
    if (doScroll)
        $("#message-box")[0].scrollTop = $("#message-box")[0].scrollHeight;
}
