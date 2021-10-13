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
     * i TO date
     * As above but calculates a month minus a day in the future.
     * 
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

    /**
     * Using the current date.now!
     * This helper function will convert the date format to the style used by the SpaceManager System.
     */
    formatTodayYYYYMMDD: () => {
        var d = new Date(),
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
     * Using the current date.now + one month!
     * This helper function will convert the date format to the style used by the SpaceManager System.
     */
         formatMonthTodayYYYYMMDD: () => {
            var d = new Date(),
                month = '' + (d.getMonth() + 2),
                day = '' + d.getDate(),
                year = d.getFullYear();
    
            if (month.length < 2)
                month = '0' + month;
            if (day.length < 2)
                day = '0' + day;
    
            return [year, month, day].join('');
        },

    /**
     * Using the current date.now + one month!
     * This helper function will convert the date format to the style used by the Smart Debit System.
     */
     smartDebit_formatMonthTodayYYYYMMDD: () => {
        var d = new Date(),
            month = '' + (d.getMonth() + 2),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;

        return [year, month, day].join('-');
    },

};