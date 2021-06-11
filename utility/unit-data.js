/**
 *   This module is a fast way to add some meta data to units without having to use a database.
 *   There is an indexed collection of info for the various unit sizes
 *   
 *   The module function performs a lookup for the sizecode, or returns a generic placeholder.
 * 
 *   This structure can be easily expanded to say overwrite the unit descriptions that come from SpaceManager
 */

let units = {
    "RI0Z8IAB25052018000Q":{
        name: "X Small",
        image: "/img/units/x-small.35sqft.png",
    },
    "RI141URI08022018005W":{
        name: "Small",
        image: "/img/units/small.75sqft.png",
    },
    "RI14TQRI08022018006Z":{
        name: "Medium",
        image: "/img/units/medium.150sqft.png",
    },
    "RI0IZLC160520200004":{
        name: "Medium",
        image: "/img/units/medium.150sqft.png",
    },
    "RI0ZFCRI08022018004L":{
        name: "Medium",
        image: "/img/units/medium.150sqft.png",
    },
    "RI0WQJC22022020000K":{
        name: "Medium",
        image: "/img/units/medium.150sqft.png",
    },
    "RI0WHRC22022020000H":{
        name: "Medium",
        image: "/img/units/medium.150sqft.png",
    },
    "RI0Z01KH250320200024":{
        name: "Medium",
        image: "/img/units/medium.150sqft.png",
    },
    "RI0ZS1C170120200030":{
        name: "Medium",
        image: "/img/units/medium.150sqft.png",
    },
    
    // This is the only unit size found so far for the container location, it's 'Medium' but I have renamed it to reflect this.
    "RI129GNB280920200002":{
        name: "Container",
        image: "/img/units/container.medium.png",
    },

    
    "RI0ZDERI08022018004F":{
        name: "Large",
        image: "/img/units/large.300sqft.png",
    },
    "RI0X1RC220220200013":{
        name: "Large",
        image: "/img/units/large.300sqft.png",
    },
    "RI0X0KC220220200010":{
        name: "Large",
        image: "/img/units/large.300sqft.png",
    },
    "RI0Z6HKH250320200028":{
        name: "Large",
        image: "/img/units/large.300sqft.png",
    },
};

module.exports = (sizecode)=>{
    if(units[sizecode]){
        return units[sizecode];
    }else{
        return {
            name : "unknown",
            image : "/img/pablo-delivery.png",
        }
    }
};