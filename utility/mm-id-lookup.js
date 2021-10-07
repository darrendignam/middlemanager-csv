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

    returnSiteId: (_site_name, _site_data)=>{
        let _result = "ERROR";

        for(let i = 0; i < _site_data.length; i++){
            if( _site_data[i].name == _site_name ){
                _result = _site_data[i].details.siteid;
            }
        }

        return _result;
    },

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

    returnContactId: (_description, _arr) => {
        let output = "NONE";
        //console.log("DES: "+_description)
        for(let i=0; i<_arr.length; i++){
            //console.log("iDES: "+_arr[i].description)
            if(_arr[i].description == _description){
                //console.log(`A: ${_arr[i].description} B: ${_arr[i].description}`)
                output = _arr[i].phonetypeid;
                break;
            }
        }
        return output;
    }


};