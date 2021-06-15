//Node Package that replaces the old 'request' package. a wrapper for the low level http and https objects 
var needle = require("needle");

//Useful tool to manage groups of async function calls
var async = require('async-waterfall');

const server_url = process.env.MIDDLEMANAGER_URL;

var needle_options = {
    compressed: true,
    accept: 'application/json',
    content_type: 'application/x-www-form-urlencoded',
    open_timeout: 5000, //max 5 second timeout
};

/**
 * Wrapper to simplify using needle
 * 
 * @param {string} api_function - which api function call you want to call against the middlemanager api
 * @param {object} post_data - Object that will become the post vars. Use and empty object {} for post with no vars
 * @param {callback} callback_function - error and response
 */
let post_wrapper = function (api_function, post_data, callback) {
    needle.post(`${server_url}${api_function}`, post_data, needle_options, function (err, res) {
        if (err) {
            callback(err);
        } else if (res.statusCode != 200) {
            callback({
                "error": "Not Found",
                "type": "404",
                "number": 404,
            });
        } else if (res.body.error) {
            callback(res.body);
        }
        // The condition below creates an error from the wrong content-type header. This is not always strictly an error. But it might make things easier to enable it
        // else if(res.headers["content-type"] && res.headers["content-type"].indexOf("application/json") == -1 ){
        //     callback({
        //         "error": "Response not JSON",
        //         "response": res.body
        //     });
        // }
        else {
            callback(null, res.body);
        }
    });
}

module.exports = {

    encodeBase64_URI : function(dateURI,callback){
        needle.get(dateURI, { encoding: null }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let raw = Buffer.from(body).toString('base64');
                let data = "data:" + response.headers["content-type"] + ";base64," + raw;
                //console.log(data);
                
                let result = {};
                result["data"] = data;
                result["raw"]  = raw;
 
                callback(null, result);
            }else{
                callback(error)
            }
        });
    },

    //helper function for needle calls

    /**
     * Wrapper to simplify using needle
     * 
     * @param {string} api_function - which api function call you want to call against the middlemanager api
     * @param {object} post_data - Object that will become the post vars. Use and empty object {} for post with no vars
     * @param {callback} callback_function - error and result
     */
    post_request: post_wrapper,

    /**
     * This helper function will perform a cascade of API calls and build an object representing the current sites and units and prices
     * 
     * @param {callback} callback - error and result
     */
    getAllAvaliableUnits: function (callback) {
        this.post_request("/api/v1/base/WGetSiteDetails", {}, (err, reply) => {
            if (err) {
                callback(err);
            } else {
                //returns an array, so we need the array async-waterfall here to process each site in turn
                async ([function initializer(initArray) {
                    initArray(null, []); //prep an empty array for us to work with (in resultsArray)
                }].concat(reply.map(function (site) {
                    return function (resultsArray, nextCallback) {
                        // console.log("Site: " + site.siteid);
                        post_wrapper("/api/v1/base/WAvailableUnits", {
                            "iSite": site.siteid
                        }, (err, units) => {
                            if (err) {
                                nextCallback(err); //something went wrong, could try to recover, but lets just err out
                            } else {
                                //need to do some more processing here, or when all the callbacks have completed
                                //For now just make a single huge object

                                //reduce units array to unique SizeCodeIDs - could be smarter here and check the pricing too?
                                let tmp_results = [];
                                let hash = [];
                                for (let i = 0; i < units.length; i++) {
                                    if (!hash.includes(units[i].SizeCodeID)) {
                                        hash.push(units[i].SizeCodeID);
                                        tmp_results.push(units[i]);
                                    }
                                }

                                let tmp_obj = {
                                    "name": site.SiteName,
                                    "details": site,
                                    "units": tmp_results
                                };
                                resultsArray.push(tmp_obj);
                                // console.log( resultsArray );
                                nextCallback(null, resultsArray);
                            }
                        });

                    }
                })), function (err, finalResult) {
                    if (err) {
                        callback(err); //something went wrong, could try to recover, but lets just err out
                    } else {
                        callback(null, finalResult); //send the result of looping over the sites to the outer async, for final result processing
                    }
                });
            }
        });
    },


    /**
     * This helper function will perform a cascade of API calls and build an object representing the current sites and units and prices
     * 
     * @param {callback} callback - error and result
     */
    getAllAvaliableUnitsVerbose: function (callback) {
        this.post_request("/api/v1/base/WGetSiteDetails", {}, (err, reply) => {
            if (err) {
                callback(err);
            } else {
                //returns an array, so we need the array async-waterfall here to process each site in turn
                async ([function initializer(initArray) {
                    initArray(null, []); //prep an empty array for us to work with (in resultsArray)
                }].concat(reply.map(function (site) {
                    return function (resultsArray, nextCallback) {
                        // console.log("Site: " + site.siteid);
                        post_wrapper("/api/v1/base/WAvailableUnits", {
                            "iSite": site.siteid
                        }, (err, units) => {
                            if (err) {
                                nextCallback(err); //something went wrong, could try to recover, but lets just err out
                            } else {
                                let tmp_obj = {
                                    "name": site.SiteName,
                                    "details": site,
                                    "units": units
                                };
                                resultsArray.push(tmp_obj);
                                // console.log( resultsArray );
                                nextCallback(null, resultsArray);
                            }
                        });

                    }
                })), function (err, finalResult) {
                    if (err) {
                        callback(err); //something went wrong, could try to recover, but lets just err out
                    } else {
                        callback(null, finalResult); //send the result of looping over the sites to the outer async, for final result processing
                    }
                });
            }
        });
    },

    /**
     * This helper function will perform a cascade of API calls and build an object representing the current sites and units and prices
     * 
     * @param {callback} callback - error and result
     */
    getAllAvaliableUnitsTable: function (callback) {
        this.post_request("/api/v1/base/WGetSiteDetails", {}, (err, reply) => {
            if (err) {
                callback(err);
            } else {
                //returns an array, so we need the array async-waterfall here to process each site in turn
                async ([function initializer(initArray) {
                    initArray(null, []); //prep an empty array for us to work with (in resultsArray)
                }].concat(reply.map(function (site) {
                    return function (resultsArray, nextCallback) {
                        // console.log("Site: " + site.siteid);
                        post_wrapper("/api/v1/base/WAvailableUnits", {
                            "iSite": site.siteid
                        }, (err, units) => {
                            if (err) {
                                nextCallback(err); //something went wrong, could try to recover, but lets just err out
                            } else {
                                //let tmp_obj = { "name" : site.SiteName, "details": site ,"units" : units }; 
                                const tmp_obj = {
                                    "site.siteid": site.siteid,
                                    "site.siteCode": site.siteCode,
                                    "site.SiteName": site.SiteName,
                                    "site.Address1": site.Address1,
                                    "site.Address2": site.Address2,
                                    "site.Address3": site.Address3,
                                    "site.Town": site.Town,
                                    "site.County": site.County,
                                    "site.Country": site.Country,
                                    "site.PostCode": site.PostCode,
                                    "site.Telephone": site.Telephone,
                                    "site.Fax": site.Fax,
                                    "site.ContactName": site.ContactName,
                                    "site.Email": site.Email,
                                    "site.StatusSite": site.StatusSite,
                                    "site.StatusDate": site.StatusDate,
                                };
                                for (let i = 0; i < units.length; i++) {
                                    let _clone = JSON.parse(JSON.stringify(tmp_obj));
                                    _clone["unit.UnitID"] = units[i].UnitID;
                                    _clone["unit.UnitNumber"] = units[i].UnitNumber;
                                    _clone["unit.SizeCodeID"] = units[i].SizeCodeID;
                                    _clone["unit.SiteID"] = units[i].SiteID;
                                    _clone["unit.Description"] = units[i].Description;
                                    _clone["unit.Weekrate"] = units[i].Weekrate;
                                    _clone["unit.MonthRate"] = units[i].MonthRate;
                                    _clone["unit.PhysicalSize"] = units[i].PhysicalSize;
                                    _clone["unit.Height"] = units[i].Height;
                                    _clone["unit.Width"] = units[i].Width;
                                    _clone["unit.Depth"] = units[i].Depth;
                                    _clone["unit.ledgeritemid"] = units[i].ledgeritemid;
                                    _clone["unit.VatCode"] = units[i].VatCode;
                                    _clone["unit.VATRate"] = units[i].VATRate;

                                    resultsArray.push(_clone);
                                }

                                nextCallback(null, resultsArray);
                            }
                        });

                    }
                })), function (err, finalResult) {
                    if (err) {
                        callback(err); //something went wrong, could try to recover, but lets just err out
                    } else {
                        callback(null, finalResult); //send the result of looping over the sites to the outer async, for final result processing
                    }
                });
            }
        });
    },

    /**
     * Send iSite and/or iSize parameters to the API server.
     * 
     * @param {object} post_data - Object {"iSite":"id", "iSize":"id"} that will become the post vars. iSize is optional
     * @param {callback} callback_function- error and result
     */
    getAvaliableUnits: function (post_data, callback) {
        this.post_request("/api/v1/base/WAvailableUnits", post_data, callback);
    },

    /**
     * This helper function will find the first avaliable unit from a site of a supplied sizecode
     * 
     * @param {string} siteid - site
     * @param {string} sizecode - sizecode
     * @param {callback} callback - error and result
     */
    getAvaliableUnit: function (siteid, sizecode, callback) {
        this.post_request("/api/v1/base/WAvailableUnits", {
            "iSite": siteid,
            "iSize": sizecode
        }, (err, units) => {
            if (err) {
                callback(err); //something went wrong, could try to recover, but lets just err out
            } else {
                //return the first one
                callback(null, units[0]);
            }
        });
    },

    /**
     * Send object parameters to the API server to create new Space Manager Customer.
     * 
     * @param {object} post_data - Object (See https://mm.tickertape.cc/api/v1/base/WAddCustomer) 
     * @param {callback} callback_function- error and result
     */
    addCustomer: function (post_data, callback) {
        this.post_request("/api/v1/base/WAddCustomer", post_data, callback);
    },

    /**
     * Send object parameters to the API server to create new contract.
     * This is an 'extended' function, as the middleware is doing a set of 'W' functions before returning a 
     * result.
     * 
     * @param {object} post_data - Object (See https://mm.tickertape.cc/api/v1/extended/CreateNewContract) 
     * @param {callback} callback_function- error and result
     */
    createNewContract: function (post_data, callback) {
        this.post_request("/api/v1/extended/CreateNewContract", post_data, callback);
    },

    /**
     * Send object parameters to the API server to create new contract.
     * This is an 'extended' function, as the middleware is doing a set of 'W' functions before returning a 
     * result.
     * 
     * @param {object} post_data - Object (See https://mm.tickertape.cc/api/v1/extended/CSV_CheckIn) 
     * @param {callback} callback_function- error and result
     */
    CSV_CheckIn: function (post_data, callback) {
        this.post_request("/api/v1/extended/CSV_CheckIn", post_data, callback);
    },

    /**
     * Send object parameters to the API server to create new SM customer and generate a reservation.
     * 
     * @param {object} post_data - Object (See https://mm.tickertape.cc/api/v1/base/WMakeReservation) 
     * @param {callback} callback_function- error and result
     */
    MakeReservation: function(post_data, callback) {
        this.post_request("/api/v1/base/WMakeReservation", post_data, callback);
    },

    /**
     * Send object parameters to the API server to create new SM customer and generate a reservation.
     * 
     * @param {object} post_data - Object (See https://mm.tickertape.cc/api/v1/base/WAddCustomerWithReservation) 
     * @param {callback} callback_function- error and result
     */
    addCustomerWithReservation: function (post_data, callback) {
        this.post_request("/api/v1/base/WAddCustomerWithReservation", post_data, callback);
    },

    /**
     * Send object parameters to the API server to upload a file in base64 format.
     * 
     * @param {object} post_data - Object (See https://mm.tickertape.cc/api/v1/base/WInsertOLEDDocumentBase64) 
     * @param {callback} callback_function- error and result
     */
     InsertOLEDDocumentBase64: function (post_data, callback) {
        this.post_request("/api/v1/base/WInsertOLEDDocumentBase64", post_data, callback);
    },

    /**
     * Simple test function, just to make sure the API is running.
     * Will return immediatly and write is results into the node console.
     */
    testing: function () {
        needle("post", `${server_url}$/api/v1/base/WGetSiteDetails`, {}, function (err, res) {
            if (err) {
                console.error(err);
            };
            console.log(res.body);
        });
    },

}; //module