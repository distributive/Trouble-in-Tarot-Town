let currentMessageGroup;

function receiveMessage (sender, content, type)
{
    if (!currentMessageGroup || type == "header")
        splitMessages ();

    // Add new message
    let jQueryRef;
    if (sender)
        jQueryRef = $(messageTempl.replace ("@sender", sender).replace ("@content", content));
    else
        jQueryRef = $(statementTempl.replace ("@content", content));

    if (type)
        jQueryRef.addClass (type);

    jQueryRef.appendTo (currentMessageGroup);
    jQueryRef.hide ();
    jQueryRef.slideDown (100, slideToBottom);
}

function splitMessages ()
{
    // Add new divider
    currentMessageGroup = $("<div class='message-group'></div>");
    currentMessageGroup.appendTo ($("#messages"));

    // Fix scroll height to the bottom of the messages
    slideToBottom ();
}

function clearMessages ()
{
    $("#messages").empty ();
}

function slideToBottom ()
{
    $("#messages")[0].scrollTop = $("#messages")[0].scrollHeight
}
