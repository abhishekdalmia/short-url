let allFunctions = {
    getIat: function() {
        let currTime = new Date();
        return (currTime.getTime());
    },
    getDate: function() {
        let today = new Date();
        let y = today.getFullYear();
        let m = String(today.getMonth() + 1).padStart(2, "0");
        let d = String(today.getDate()).padStart(2, "0");
        return y+m+d;
    }
}

module.exports = allFunctions;