const mm = require("./mm-wrapper");

module.exports = {
    /**
     * This function will get all the SM database IDs for the units, so we can look for them when the CSV rows are imported.
     * 
     * @param {callback} callback 
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
    
    /**
     * This function will get all the SM database IDs for the 'ContactTypes' needed when adding phone/email data to a user
     * 
     * @param {callback} callback 
     */
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

    /**
     * This function returns either an "ERROR" string, or the SpaceManager database ID of the site name you pass.
     * 
     * @param {String} _site_name - The text name of the site you would like the ID for
     * @param {Array} _site_data - An array of site objects to search through (Build this array by calling getSiteData in this module.)
     */
    returnSiteId: (_site_name, _site_data)=>{
        let _result = "ERROR";

        for(let i = 0; i < _site_data.length; i++){
            if( _site_data[i].name == _site_name ){
                _result = _site_data[i].details.siteid;
            }
        }

        return _result;
    },

    /**
     * This function returns either an "ERROR" string, or the SpaceManager database ID of the size code string you pass.
     * It will search through the array of sites and units looking for the ID.
     * 
     * @param {String} _size_name - The text name of the unit size code you would like the ID for
     * @param {Array} _site_data - An array of site objects to search through (Build this array by calling getSiteData in this module.)
     */
    returnSizeCode: (_size_name, _site_data)=>{
        let _result = "ERROR";

        for(let i = 0; i < _site_data.length; i++){
            for(let j = 0; j < _site_data[i].units.length; j++){
                if( _site_data[i].units[j].Sizecode == _size_name ){
                    _result = _site_data[i].units[j].SizeCodeID;
                    break;
                }
            }
        }

        return _result;
    },

    /**
     * This function returns either a "NONE" string, or the SpaceManager database ID of the contact type you want.
     * It will search through the array of contact types looking for the ID.
     * 
     * @param {String} _description - The text of the contact type you would like the ID for
     * @param {Array} _array - An array of contact types to search through (Build this array by calling getContactData in this module.)
     */
    returnContactId: (_description, _array) => {
        let output = "NONE";
        //console.log("DES: "+_description)
        for(let i=0; i<_array.length; i++){
            //console.log("iDES: "+_arr[i].description)
            if(_array[i].description == _description){
                //console.log(`A: ${_arr[i].description} B: ${_arr[i].description}`)
                output = _array[i].phonetypeid;
                break;
            }
        }
        return output;
    }


};
