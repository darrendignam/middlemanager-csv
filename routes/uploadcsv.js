var express = require('express');
var router = express.Router();

var async = require('async-waterfall');

var mm = require('../utility/mm-wrapper');
var _unitData = require('../utility/unit-data');
var _unitSizecode = require('../utility/unit-sizecode');
var _widgets = require('../utility/widgets')

const json2csv = require('json2csv').parse;

const fs = require('fs');
const multer = require('multer');
const csv = require('fast-csv');
const { strict } = require('assert');
const upload = multer({ dest: 'uploadedcsv/' });

//TODO - this site is hardcoded in - but needs to come from the CSV
const _SITE = "RI1GRWXX250320060000";



router.get('/', function (req, res) {
    res.render("data/uploadcsv");
});

// req.file will contain the uploaded file information. 
router.post('/', upload.single('csvfile'), function (req, res) {
    // open uploaded file
    const fileRows = [];
    const validRows = [];
    const responseRows = [];

    if (req.file && req.file.path) {
        csv.parseFile(req.file.path)
            .on("data", (data) => {
                fileRows.push(data); // push each row
            })
            .on("end", () => {
                // console.log(fileRows);
                fs.unlinkSync(req.file.path); // remove temp file
                //process "fileRows" and respond

                // skip first row of labels... (i=1 not i=0 ;)
                for (let i = 1; i < fileRows.length; i++) {
                    if (fileRows[i].length > 0) {
                        //push each row into middlemanager API, and save the reponses into a result array
                        validRows.push(fileRows[i]);
                    }
                }

                //process the discovered rows of the CSV through the reservation W function
                async ([function initializer(initArray) {
                    initArray(null, []); //prep an empty array for us to work with (in resultsArray)
                }].concat(validRows.map(function (current_csv_row) {
                    return function (resultsArray, nextCallback) {
                        //loop over the valid array items and try and push them into SM
                        // Booking ID,	Reservation Transaction ID,	Reservation Amount Paid,	Container Size,	Container ID,	Duration,	First Name,	Surname,	Email,	Telephone,	Weekly Price,	Offer Price,	Offer Duration,	Moving In Date,	Billing Title,	Billing First Name,	Billing Surname,	Billing Email Address,	Billing Company Name,	Billing Address Line One,	Billing Address Line Two,	Billing Address Line Three,	Billing City,	Billing PostCode,	Correspondance Title,	Correspondance First Name,	Correspondance Surname,	Correspondance Email Address,	Correspondance Company Name,	Correspondance Address Line One,	Correspondance Address Line Two,	Correspondance Address Line Three,	Correspondance City,	Correspondance PostCode,	Car Registration,	Mobile,	SMS Consent,	Photo ID Document,	Address ID Document,	Authorised Persons,	Insurance Amount,	Insurance Price,	Insurance Declined,	Insurance Proof Document,	Insurance Type,	DD Name,	DD Sort Code,	DD Account Number,	DD Consent,	DD Declined,	eSignDocumentId,	Optional Extras,	Upfront Payment Amount,	Upfront Transaction ID,	Upfront Transaction Date,
                        // 0            1                           2                           3               4               5           6           7           8       9           10              11              12              13              14              15                  16                  17                      18                      19                          20                          21                          22              23                  24                      25                          26                      27                              28                              29                                  30                                  31                                  32                      33                          34                  35      36              37                  38                      39                  40                  41                  42                  43                          44              45          46              47                  48          49              50                  51                  52                      53                      54                      
                        
                        //If this is a Reservation or a Check-In....??
                        //Upfrontpayment amount = [52]
                        //MoveInDate = 
                        if(current_csv_row[52] == ""){
                            NewReservation( current_csv_row, (err, result)=>{
                                if (err) {
                                    nextCallback(err);
                                } else {
                                    //result is: //[{"CustomerID":"RI2168H253100007H000","ReservationID":"RI2168H253100007H002","InvoiceID":"SM000QOF","PaymentID":"SM000QOG"}]
                                    let tmp_result = result[0];          //this returns an array of length 1. So to make the full results array 'nicer' I de reference the first item out of it.
                                    //TODO: add some additional fields make tabulation easier....??

                                    resultsArray.push(tmp_result);     
                                    nextCallback(null, resultsArray);
                                    
                                }
                            });
                        }else{
                            NewCheckIn( current_csv_row, (err, result)=>{
                                if (err) {
                                    nextCallback(err);
                                } else {
                                    resultsArray.push(result);     
                                    nextCallback(null, resultsArray);                                    
                                }
                            });
                        }
                    }
                })), function (err, finalResult) {
                    if (err) {
                        res.json(err);
                    } else {
                        res.json(finalResult);
                    }
                });
            });
    }
});

/**
 * This helper function will perform a cascade of API calls and build an object representing the current sites and units and prices
 * 
 * @param {Array} new_reservation - Array of Customer info taken from a Row in the CSV file
 * @param {callback} callback_function - error and response
 */
function NewReservation( new_reservation, callback ){
    // construct the data to send to the WFunction
    let reservation_obj = {
        isite: _SITE, //no site so we make an assumption here it is the main location
        isurname: new_reservation[16],
        iforenames: new_reservation[15],
        ititle: new_reservation[14],
        iAdd1: new_reservation[19],
        iAdd2: new_reservation[20],
        iAdd3: new_reservation[21],
        iTown: new_reservation[22],
        iPostcode: new_reservation[23],
        iemailaddress: new_reservation[8],
        Add1: new_reservation[29],
        Add2: new_reservation[30],
        Add3: new_reservation[31],
        Town: new_reservation[32],
        Postcode: new_reservation[33],
        // inumber:    req.body.phonenumber.replace('+','%2B'),
        imovein: _widgets.formatMonthTodayYYYYMMDD(), //new_reservation[33] // need to convert this date to the correct format //TODO: Correct this to one month from now
        isizecode: _unitSizecode(new_reservation[3]).SizeCodeID,
        idepositamt: new_reservation[2],
        ivatamt: 1, //meh, i dont know what to do here! 20% of a fiver is 1 right?
        // ipaymethod: req.body.ipaymethod,
        ipayref: 'creditcard',
        icomment: [new_reservation[0], new_reservation[1], new_reservation[4], new_reservation[50], new_reservation[53], new_reservation[54]].join(', '),
    }
    mm.addCustomerWithReservation(reservation_obj, callback); //don't do anthing with the {err, result} returned by the mm function, let the calling process above handle it.
}

function NewCheckIn( new_check_in, callback ){
    // console.log( new_check_in[0] );
    // callback(null, new_check_in[0]);

    async([
        (async_callback)=>{
            //(1) Create New Customer. Could also search for existing here.....
            CreateCustomer(new_check_in,(err,_customer)=>{
                if(err){
                    console.log("Err: CreateCustomer");
                    async_callback(err);
                }else{
                    async_callback(null, { "customer" : _customer[0] }); //again, returns an array of length 1 - so just return the object
                }
            });
        },

        (_data_in,async_callback)=>{
            //(1a) upload image 1
            if(new_check_in[37]!=''){
                mm.encodeBase64_URI(new_check_in[37], (err, result)=>{
                    if(err){
                        _data_in["photoid"] = JSON.stringify(err);
                        async_callback(_data_in);
                    }else{
                        let img_obj = {
                            iCustId: _data_in.customer.custid,
                            iBlob: result.raw, //raw gives success but still no image appearing in the DB
                            iDescription:'Photo ID Document',
                            iFileType:new_check_in[37].split('.').pop()
                        };
                        console.log( img_obj.iFileType );
                        console.log( result.content_type );

                        mm.InsertOLEDocumentBase64(img_obj,(err, response)=>{
                            if(err){
                                _data_in["photoid"] = JSON.stringify(err);
                                async_callback(_data_in);
                            }else{
                                _data_in["photoid"] = JSON.stringify(response);
                                async_callback(null, _data_in);
                            }
                        });
                    }
                });
            }else{
                _data_in["photoid"] = "none supplied";
                async_callback(_data_in);
            }
        },

        (_data_in,async_callback)=>{
            //(2) Get UnitID. Making a reservation will assign us a UnitID
            mm.getAvaliableUnit(_SITE, _unitSizecode(new_check_in[3]).SizeCodeID, (err,unit)=>{
                if(err){
                    console.log("Err: getAvaliableUnit");
                    async_callback(err);
                }else{
                    //console.log(unit);
                    _data_in["unit"] = unit; //not an array is this is a wrapper mm function that post processes the array internally
                    if( _data_in.unit ){
                        //console.log(_data_in.unit);
                        async_callback(null, _data_in);
                    }else{
                        async_callback({"Error":"No Units found. The SIZECODE attached to this quote/order have all be rented out, but we have more under a different SIZECODE. Please call our office and we can find a comparable unit"});
                    }
                }
            });
        },

        (_data_in,async_callback)=>{          
            //(3) Make reservation from Customer and Unit
            let reservation_obj = {
                iCustomerID: _data_in.customer.custid,
                iSite: _SITE,
                iReservedOn: _widgets.formatTodayYYYYMMDD(),//Date the user made the reservation in the front end. Not in the CSV so I will use today's date!
                iMoveIn: _widgets.formatDateYYYYMMDD(new_check_in[13]),
                iUnit: _data_in.unit.UnitID,//can ignore this and let SM make the assignment
                //iSizecode:_unitSizecode(new_check_in[3]).SizeCodeID,
                iDepositAmt: new_check_in[2],
                iVATAmt:1,
                iPaymethod:'C6',    //called 'paymentid' in other SpaceManager functions SMH
                iPayRef:'WorldPay', //called 'paymentref' in other SM functions - sigh
                iComment:[new_check_in[0], new_check_in[1], new_check_in[4], new_check_in[50], new_check_in[53], new_check_in[54]].join(', '),

            }
            mm.MakeReservation(reservation_obj, (err, reservation_obj)=>{
                console.log(err);
                console.log(JSON.stringify( reservation_obj ));
                
                res_obj = reservation_obj[0];//always a single element array from the middelware driver
                if(err){
                    async_callback(err);
                }else{
                    if(res_obj.CustomerID && res_obj.ReservationID && res_obj.InvoiceID && res_obj.PaymentID){
                        _data_in["reservation"] = res_obj;
                        async_callback(null, _data_in);
                    }else{
                        async_callback(reservation_obj);
                    }
                }
            });
        },
        //TODO: Add more functions here to handle the images, the direct de bit, the additional authorised users, but for now, let's do the simple case.
        (_data_in,async_callback)=>{
            //(4) try and push this to a new order

            CreateCheckIn(new_check_in, _data_in, (err, _contract)=>{
                if(err){
                    console.log("Err: CreateCheckIn");
                    async_callback(err);
                }else{
                    _data_in["contract"] = _contract; //add the result to the results object we have been building.
                    async_callback(null, _data_in); //pass the result to the final handler (below)
                }
            });
        },
    ],(err,final_result)=>{
        if(err){
            //if you see something like// [{"'1'":"1"}]  //then it was the reservation that errored
            console.log("Err: New Checkin");
            callback(err);
        }else{
            //console.log(final_result);

            // OK, so an example of a successful response from the SpaceManager backend is not actually JSON. It's:
            // "SQLState: 00000SQLCode: 0ContractID: RI214L1453100"
            // excluding the double-quotes...... Perhaps the middleware could do this step, but for now, we do it here....
            // regex to the rescue

            let result_regex = /(SQLState: 00000SQLCode: 0ContractID:)\s([A-Z0-9]{1,20})/g;
            let orderid = result_regex.exec(final_result.contract)[2];

            if(orderid!=''){
                final_result["orderid"] = orderid;
                callback(null, final_result);
      
            }else{
                callback({"error" : "SpaceManager returned an empty ID", "message" : final_result});
            }
        }
    });

}

function CreateCustomer(_data_in, callback){
            //create new spaceman user
            mm.addCustomer({
                "idoreturn": 1, //return CustomerID (true / false)
                "isite": _SITE,
                "isurname": _data_in[16],
                "iforenames": _data_in[15],
                "ititle": _data_in[14],
                "iAdd1": _data_in[19],
                "iAdd2": _data_in[20],
                "iAdd3": _data_in[21],
                "iTown": _data_in[22],
                "iPostcode": _data_in[23],
                "Add1": _data_in[29],
                "Add2": _data_in[30],
                "Add3": _data_in[31],
                "Town": _data_in[32],
                "Postcode": _data_in[33],
                // "idob": null,
                "inotes": [_data_in[0], _data_in[1], _data_in[4], _data_in[50], _data_in[53], _data_in[54]].join(', ') ,
                "iemailaddress": _data_in[8],
            }, callback );
}

function CreateCheckIn(_new_check_in, _data_in, callback){
    let order_details = {
        customerid:         _data_in.customer.custid, //This terrible naming of the custid is what the WFunction returns
        siteid:             _SITE,
        unitid:             _data_in.unit.UnitID,
        ireservationid:     _data_in.reservation.ReservationID,
        startdate:          _widgets.formatDateYYYYMMDD(_new_check_in[13]),
        chargetodate:       _widgets.itodateDateYYYYMMDD(_new_check_in[13]), // Set this to like 1 month from now, minus one day?? Format: YYYY-MM-DD
        invoicefrequency:   1,
        invfreqtype:        'W',
        rateamount:         _new_check_in[10],
        depositamount:      _new_check_in[2],
        amount:             _new_check_in[52]/100,
        vatcode:            _data_in.unit.VatCode,
        paymentid:          'C6',
        paymentref:         'WorldPay',
        goodsvalue:         _new_check_in[40],
        salesitems:         _new_check_in[51],
        notes:              [_new_check_in[39], _new_check_in[0], _new_check_in[1], _new_check_in[4], _new_check_in[50], _new_check_in[53], _new_check_in[54], _new_check_in[34] ].join(', ') ,

    };
    //console.log(order_details);
    mm.CSV_CheckIn(order_details, callback);
}
module.exports = router;