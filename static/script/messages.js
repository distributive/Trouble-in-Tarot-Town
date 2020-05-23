function receiveMessage (sender, content)
{
    // Add new message
    if (sender)
        $(messageTempl.replace ("@sender", sender).replace ("@content", content)).appendTo ($("#message-box"));
    else
        $(statementTempl.replace ("@content", content)).appendTo ($("#message-box"));

    // Fix scroll height to the bottom of the messages
    $("#message-box")[0].scrollTop = $("#message-box")[0].scrollHeight;
}

function splitMessages ()
{
    // Add new divider
    $("<hr>").appendTo ($("#message-box"));

    // Fix scroll height to the bottom of the messages
    $("#message-box")[0].scrollTop = $("#message-box")[0].scrollHeight;
}
