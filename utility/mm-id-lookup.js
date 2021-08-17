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
    //returns:
    // [{
    //   "phonetypeid": "RI16CTRI08022018007N",
    //   "description": "Email"
    // },
    // {
    //   "phonetypeid": "RI16CXRI08022018007O",
    //   "description": "Mobile"
    // },]

    returnContactId: (_description, _arr) => {
        let output = "";
        for(let i; i<arr.length; i++){
            if(arr[i].description && arr[i].phonetypeid && arr[i].description == _description){
                output = arr[i].phonetypeid;
                break;
            }
        }
        return output;
    }


};