const mm = require("./mm-wrapper");

module.exports = {
    /**
     * This function will get all the SM database IDs for the units, so we can look for them when the CSV rows are imported.
     * 
     * @param {string} callback 
     */
    getSiteData: (callback) => {
        mm.getAllAvaliableUnits( (err, result)=> {
            if(err){
                return callback(err);
            }else{
                //console.log(result);
                return callback(null, result);
            }
        });
    },
    
    getContactData: (callback) => {
        mm.getContactType({"TheType":""}, (err, data)=>{
            if(err){
                callback(err);
            }else{
                callback(null, data);
            }
        });
    },
};