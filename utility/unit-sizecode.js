/**
 *   
 *   The module function performs a lookup converting textual size to sizecode
 * 
 */

 let sizes = {

    //By Name
    "Meduim":{
        Sizecode: "SC0150",
        SizeCodeID: "RI0ZFCRI08022018004L",
    },
    "Large":{
        Sizecode: "SC0300",
        SizeCodeID: "RI0ZDERI08022018004F",
    },
    "Small":{
        Sizecode: "SC0075",
        SizeCodeID: "RI141URI08022018005W",
    },
    "XSmall":{
        Sizecode: "SC0035",
        SizeCodeID: "RI0Z8IAB25052018000Q",
    },

    //By Dimensions (These have been added because the CSV file has them named like this)
    "150 SQ FT":{
        Sizecode: "SC0150",
        SizeCodeID: "RI0ZFCRI08022018004L",
    },
    "300 SQ FT":{
        Sizecode: "SC0300",
        SizeCodeID: "RI0ZDERI08022018004F",
    },
    "75 SQ FT":{
        Sizecode: "SC0075",
        SizeCodeID: "RI141URI08022018005W",
    },
    "35 SQ FT":{
        Sizecode: "SC0035",
        SizeCodeID: "RI0Z8IAB25052018000Q",
    },
    
    //TODO: The CSV File has a 50 SQ FT row, but we dont have an option for that. So going to allocate 75, the next size up...
    "50 SQ FT":{
        Sizecode: "SC0075",
        SizeCodeID: "RI141URI08022018005W",
    },  
    
};

module.exports = (size)=>{
    if(sizes[size]){
        return sizes[size];
    }else{
        return {
            //Medium by default?? perhaps have some error handling!
            Sizecode: "SC0150",
            SizeCodeID: "RI0ZFCRI08022018004L",
        }
    }
};