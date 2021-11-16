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
     * Using the provided date. Add 5 days - the min amount needed for a direct debit mandate to process??? (not sure)
     * Then try and fit that date to either the 14th or 28th of the month? its the day they manually process DD's
     * This helper function will convert the date format to the style used by the Smart Debit System.
     * 
     * At least 5 days away. and then either 14 or 28
     */
    //TODO: Can produce a date in the past, which upsets the smartdebit code. Perhaps check if this generated date fails the 5 days in the future thing...
     smartDebit_formatMonthTodayYYYYMMDD: (in_date) => {
        var d = new Date(in_date),
            month = '' + (d.getMonth() + 1),
            day = '' + (d.getDate()+5),         //the +5 here is adding 5 days to now, the min time needed for buffering the first DD payment for the banks to do their thing?
            year = d.getFullYear();

            //Might noee a second pair of eyes to double check this!!
            day = parseInt(day);
            if(day<14){                      //now +5 is less than the 14th, so set it to the 14th
                day = ''+14;
            }else if(day<28){                //now +5 is after the 14th but before the 28th, so roll them upto the 28th
                day = ''+28;
            }else if(day > 28){              //now +5 is after the 28th, so its next month?
                day = ''+14;
                //rollover the month, and perhaps the year!?
                if( parseInt(month)+1 <= 12 ){
                    month = ''+(parseInt(month)+1);
                }else{
                    month = ''+1; //jan
                    year = ''+ (parseInt(year)+1); //inc year
                }
            }else{                           //not sure what the date is now sigh!! HOW?
                day = ''+28;
            }


        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;

        let _dd_date = [year, month, day].join('-');
        console.log('DD DATE: ' + _dd_date);
        return _dd_date;
    },
    /**
     * This function will remove the VAT from a price
     * 
     * @param {Number} val - The price or amount with VAT included.
     * @param {Number} VATrate - The VAT you want to remove. 20% should be entered as 0.20 or 17.5% as 0.175 etc.
     */
    removeVAT: (val, VATrate)=>{
        return Math.round(  (( val * 100 ) / ((VATrate*100)+100) ) * 100) / 100 ;
    },
    /**
     * This function will convert weelky to rates to monthly rates.
     * 
     * @param {Number} rate - The price or amount with VAT included.
     */
     convertWtoM: (rate)=>{
        return Math.round( ((rate * 52)/12) * 100) / 100;
    },

    

};