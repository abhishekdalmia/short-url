let allFunctions = {
    getIat: function() {
        return Date.now();
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