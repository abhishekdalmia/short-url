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
    let url = 'http://127.0.0.1:3000/';
    xhr.open('POST', url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            let queryResponse = JSON.parse(xhr.responseText);
            document.getElementById('message').innerHTML = queryResponse['msg'];
            // if the request was successFul, the queryResponse also contains <shortUrl>, just in case it is needed here.
        }
    }
    xhr.send(JSON.stringify({ "longUrl": longUrl, "customName": customName }));
}