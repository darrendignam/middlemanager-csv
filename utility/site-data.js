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
        description:"Storing your items may be necessary for a variety of reasons and there are many options to suit your needs. Storage can be long term or short term. It can be for personal and business reasons. What you store can range from furniture to vehicles to paperwork.",
    },
    "RI0Z8DNB051020200001":{
        name: "Twenty4 Container Hire",
        image: "",
        description:"You don't need to be in the Leeds area to enjoy self storage from the Self Storage Association's Best Container Storage Facility in 2019 and 2020. With Twenty4 Offsite Container Hire, wherever you are in Yorkshire, Lancashire and the North of England, we can bring the most convenient, award-winning competitively priced, high quality storage solution to your business or household.",
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