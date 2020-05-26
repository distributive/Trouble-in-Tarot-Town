let currentMessageGroup;

function receiveMessage (sender, content)
{
    if (!currentMessageGroup)
        splitMessages ();

    // Add new message
    let jQueryRef;
    if (sender)
        jQueryRef = $(messageTempl.replace ("@sender", sender).replace ("@content", content));
    else
        jQueryRef = $(statementTempl.replace ("@content", content));

    jQueryRef.appendTo (currentMessageGroup);
    jQueryRef.hide ();
    jQueryRef.slideDown (100);

    // Fix scroll height to the bottom of the messages
    $("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
}

function splitMessages ()
{
    // Add new divider
    currentMessageGroup = $("<div class='message-group'></div>");
    currentMessageGroup.appendTo ($("#messages"));

    // Fix scroll height to the bottom of the messages
    $("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
}

function clearMessages ()
{
    $("#messages").empty ();
}
