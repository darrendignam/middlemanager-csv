module.exports = {
    /**
     * This helper function will convert the date format to the style used by the SpaceManager System
     * 
     * @param {string} date
     */
    formatDateYYYYMMDD: (date) => {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;

        return [year, month, day].join('');
    },

    /**
     * This helper function will convert the date format to the style used by the SpaceManager System. 
     * And adjust for the itodate requirement (1 month from now, minus one day)
     * 
     * @param {string} date
     */
    itodateDateYYYYMMDD: (date) => {
        var d = new Date(date),
            month = '' + (d.getMonth() + 2),
            day = '' + (d.getDate()-1),
            year = d.getFullYear();

        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;

        return [year, month, day].join('');
    },


};