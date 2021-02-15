function shortenUrl() {
    document.getElementById("queryComplete").style.visibility="hidden";
    let customName = document.getElementById('customName').value;
    let longUrl = document.getElementById('longUrl').value;
    if (!longUrl) {
        document.getElementById("queryComplete").innerHTML = 'Url field cannot be empty.';
        document.getElementById("queryComplete").style.visibility="visible";
        return;
    }
    let xhr = new XMLHttpRequest();
    let url = '/url/';
    xhr.open('POST', url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            let queryResponse = JSON.parse(xhr.responseText);
            document.getElementById('message').innerHTML = queryResponse['message'];
            if (queryResponse['shortUrl'] !== null) {
                document.getElementById('shortUrl').innerHTML = queryResponse['shortUrl'];
                document.getElementById("copyUrlButton").style.visibility="visible";
            }
            else {
                document.getElementById('shortUrl').innerHTML = "";
                document.getElementById("copyUrlButton").style.visibility="hidden";
            }
        }
    }
    xhr.send(JSON.stringify({ "longUrl": longUrl, "customName": customName }));
}

function copyUrl() {
    let shortenedUrl = document.getElementById("shortUrl");
    if (document.body.createTextRange) {
        // internet explorer
        let range = document.body.createTextRange();
        range.moveToElementText(shortenedUrl);
        range.select();
        document.execCommand("copy");
        document.selection.empty();
    }
    else if (window.getSelection) {
        // other browsers
        let selection = window.getSelection();
        let range = document.createRange();
        range.selectNodeContents(shortenedUrl);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand("copy");
        window.getSelection().removeAllRanges();
    }
    document.getElementById("queryComplete").innerHTML = 'Copied URL to clipboard.';
    document.getElementById("queryComplete").style.visibility="visible";
}