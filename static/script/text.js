/* HTML TEMPLATES */
let playerTempl = `
<div class="player">
    <div class="background">
        <img class="icon" src="static/img/icon/unknown.png" />
    </div>
    <div class="tag">
        <p>@name</p>
    </div>
</div>`;

let cardTempl = `
<div class="card">
    <img class="bg" src="@bg" onerror="this.src = 'static/img/card/placeholder.png';" />
    <img class="fg" src="static/img/card/fg.png" />
    <div class="title-box">
        <h1>@title</h1>
        <img src="static/img/card/titleBox.png" />
    </div>
    <div class="text-box">
        <span>@description</span>
        <img src="static/img/card/textBox.png" />
    </div>
</div>`;



let messageTempl = `
<div class="message">
    <span class="sender">@sender: </span>
    <span class="content">@content</span>
</div>`;

let statementTempl = `
<div class="statement">
    <span class="content">@content</span>
</div>`;



let cardDexEntryTempl = `
<h6>@header</h6>
<p>@description</p>
<div class="card-list">@cards</div>`;
/* HTML TEMPLATES END */
