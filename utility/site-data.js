/**
 *   This module is a fast way to add some meta data to sites without having to use a database.
 *   There is an indexed collection of info for the various unit sizes
 *   
 *   The module function performs a lookup for the ID, or returns a generic placeholder.
 * 
 */

 let sites = {
    "RI1GRWXX250320060000":{
        name: "Twenty4 Secure Storage",
        image: "",
        description:"",
    },
    "RI0Z8DNB051020200001":{
        name: "Twenty4 Container Hire",
        image: "",
        description:"",
    },
};

module.exports = (siteid)=>{
    if(sites[siteid]){
        return sites[siteid];
    }else{
        return {
            name: "Unknown",
            image: "",
            description:"",
        }
    }
};