function shortenUrl() {
    let customName = document.getElementById('customName').value;
    let longUrl = document.getElementById('longUrl').value;
    if (!longUrl) {
        alert('Url field cannot be empty.');
        return;
    }
    let pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    if (!pattern.test(longUrl)) {
        alert('Given string is not a valid Url.');
        return;
    }
    let xhr = new XMLHttpRequest();
    let url = '/';
    xhr.open('POST', url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            let queryResponse = JSON.parse(xhr.responseText);
            document.getElementById('message').innerHTML = queryResponse['msg'];
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
        // for ie
        let range = document.body.createTextRange();
        range.moveToElementText(shortenedUrl);
        range.select();
        document.execCommand("copy");
        alert("Copied URL to clipboard.");
    }
    else if (window.getSelection) {
        // other browsers
        let selection = window.getSelection();
        let range = document.createRange();
        range.selectNodeContents(shortenedUrl);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand("copy");
        alert("Copied URL to clipboard.");
    }
}