var express = require('express');
var router = express.Router();

var async = require('async-waterfall');

var mm = require('../utility/mm-wrapper');
var mmLookup = require('../utility/mm-id-lookup');

var _widgets = require('../utility/widgets');

const json2csv = require('json2csv').parse;
var parseXML = require('xml2js').parseString;

const fs = require('fs');
const multer = require('multer');
const csv = require('fast-csv');
const { strict } = require('assert');
const widgets = require('../utility/widgets');

const upload = multer({ dest: 'uploadedcsv/' });

// This module has an array/object with human readable names for the CSV columns numbers so debugging and reading the code is a bit easier when ever we are pulling random 
// columns from the current row of the CSV
let _csv  = require('../utility/csv-col-names');

// console.log( _csv['0 Type'] );

//for smart debit......
// var needle = require("needle");
var request = require('request');


router.get('/', (req, res)=>{
    res.render("data/uploadcsv");
});

// req.file will contain the uploaded file information. 
router.post('/', upload.single('csvfile'), (req, res)=>{
    // open uploaded file
    const fileRows = [];
    const validRows = [];
    const responseRows = [];

    //used to prevent repeated API calls to get the fairly static data from the database
    let g_contactData = [];
    let g_siteData = [];

    if (req.file && req.file.path) {
        // This might be an option: csv.parseFile(req.file.path, {headers: true}) with the 'headers' option enabled, we get named objects - but the lates CSV file is full of tabs, so the code breaks...
        csv.parseFile(req.file.path)
            .on("data", (data) => {
                //console.log(data);
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

                //manually create valid rows 2d array for processing:
                //validRows = []
                //validRows.push([ "","","","","","" .......... ])


                console.log("Processing CSV File....");

                ProcessRows(validRows, (err, finalResult) => {
                    if (err) {
                        res.json(err);
                    } else {
    
                        // console.log(finalResult);
    
                        let result_table = [];
    
                        //build a results table
                        for(let i=0;i<finalResult.length;i++){
                            // result_table.push( JSON.stringify(finalResult[i]) );
                            let _row = {
                                "booking-id": finalResult[i]?.bookingid,
                                "customer-name": finalResult[i]?.name,
                                "customer-email": finalResult[i]?.email,
                                "customer-id": finalResult[i]?.customer?.custid,
                                
                                "unit-UnitID": finalResult[i]?.unit?.UnitID,
                                "unit-UnitNumber": finalResult[i]?.unit?.UnitNumber,
                                "unit-SizeCodeID": finalResult[i]?.unit?.SizeCodeID,
                                "unit-Sizecode": finalResult[i]?.unit?.Sizecode,
                                "unit-Description": finalResult[i]?.unit?.Description,
                                "unit-Weekrate": finalResult[i]?.unit?.Weekrate,
                                "unit-MonthRate": finalResult[i]?.unit?.MonthRate,
                                "unit-PhysicalSize": finalResult[i]?.unit?.PhysicalSize,
                                "unit-Height": finalResult[i]?.unit?.Height,
                                "unit-Width": finalResult[i]?.unit?.Width,
                                "unit-Depth": finalResult[i]?.unit?.Depth,
                                "unit-ledgeritemid": finalResult[i]?.unit?.ledgeritemid,
                                "unit-VatCode": finalResult[i]?.unit?.VatCode,
                                "unit-VATRate": finalResult[i]?.unit?.VATRate,
    
                                "reservation-CustomerID": finalResult[i]?.reservation?.CustomerID,
                                "reservation-ReservationID": finalResult[i]?.reservation?.ReservationID,
                                "reservation-InvoiceID": finalResult[i]?.reservation?.InvoiceID,
                                "reservation-PaymentID": finalResult[i]?.reservation?.PaymentID,
    
                                "photoid": finalResult[i]?.photoid,
                                "photoaddress": finalResult[i]?.photoaddress,
                                "bankaccountID" : finalResult[i]?.bankaccount,
                                "contract":finalResult[i]?.contract,
                                "orderid":finalResult[i]?.orderid,
                            }
    
                            result_table.push(_row);
                        }
    
                        //console.log(finalResult.length);
    
                        //res.json(finalResult);
                        res.render('data/data_table', {data:result_table}); //need top pretty print this stuff in the pug...??
                    }
                });

            });// on "end" 
    }
});

/**
 * This function loops over a 2d array of data and processes each 'row' of data (initially from the sample CSV file)
 * 
 * @param {Array} incoming_rows - Array 'rows' each row is an array or strings and numbers based on the sample CSV file
 * @param {callback} rows_complete - error and response - callback function with results or error
 */
function ProcessRows(incoming_rows, rows_complete){
    // Get the IDs from the SM database so we dont have to have them hard coded everywhere!!
    async([  
        (callback)=>{
            mmLookup.getSiteData((err, siteData)=>{
                if(err){
                    callback(err);
                }else{
                    callback(null, siteData);
                }
            });
        },
        (_incomingSiteData, callback)=>{
            mmLookup.getContactData((err, contactdata)=>{
                if(err){
                    callback(err);
                }else{
                    callback(null, [contactdata, _incomingSiteData]);
                }
            });
        },
    ], (err, spacemanagerIDs)=>{
        if (err) {
            res.json(err);
        } else {
            //save the data
            g_contactData = spacemanagerIDs[0];
            g_siteData = spacemanagerIDs[1];
            
            console.log( g_contactData );
            console.log( "ProcessRows : Contact.Email: " + mmLookup.returnContactId('Email', g_contactData) );
            
            console.log( g_siteData[0].name );
            

            //process all the valid rows....
            
            //process the discovered rows of the CSV through the reservation W function
            async([function initialiser(initArray) {
                initArray(null, []); //prep an empty array for us to work with (in resultsArray)
            }].concat(incoming_rows.map( (current_csv_row)=>{
                return function (resultsArray, nextCallback) {
                                                        //loop over the valid array items and try and push them into SM
                                                        // Booking ID,	Reservation Transaction ID,	Reservation Amount Paid,	Container Size,	Container ID,	Duration,	First Name,	Surname,	Email,	Telephone,	Weekly Price,	Offer Price,	Offer Duration,	Moving In Date,	Billing Title,	Billing First Name,	Billing Surname,	Billing Email Address,	Billing Company Name,	Billing Address Line One,	Billing Address Line Two,	Billing Address Line Three,	Billing City,	Billing PostCode,	Correspondance Title,	Correspondance First Name,	Correspondance Surname,	Correspondance Email Address,	Correspondance Company Name,	Correspondance Address Line One,	Correspondance Address Line Two,	Correspondance Address Line Three,	Correspondance City,	Correspondance PostCode,	Car Registration,	Mobile,	SMS Consent,	Photo ID Document,	Address ID Document,	Authorised Persons,	Insurance Amount,	Insurance Price,	Insurance Declined,	Insurance Proof Document,	Insurance Type,	DD Name,	DD Sort Code,	DD Account Number,	DD Consent,	DD Declined,	eSignDocumentId,	Optional Extras,	Upfront Payment Amount,	Upfront Transaction ID,	Upfront Transaction Date,
                                                        // 0            1                           2                           3               4               5           6           7           8       9           10              11              12              13              14              15                  16                  17                      18                      19                          20                          21                          22              23                  24                      25                          26                      27                              28                              29                                  30                                  31                                  32                      33                          34                  35      36              37                  38                      39                  40                  41                  42                  43                          44              45          46              47                  48          49              50                  51                  52                      53                      54                      
                    

                    // New CSV Order:
                    // Type,    Booking ID, Reservation Transaction ID, Reservation Amount Paid,    Container Size, Container ID,   Size Code,	Location Code,	Duration,   First Name,	Surname,	Email,	Telephone,	Weekly Price,	Offer Price,	Offer Duration,	Moving In Date,	Billing Title,	Billing First Name,	Billing Surname,	Billing Email Address,	Billing Company Name,	Billing Address Line One,	Billing Address Line Two,	Billing Address Line Three,	Billing City,	Billing PostCode,	Correspondance Title,	Correspondance First Name,	Correspondance Surname,	Correspondance Email Address,	Correspondance Company Name,	Correspondance Address Line One,	Correspondance Address Line Two,	Correspondance Address Line Three,	Correspondance City,	Correspondance PostCode,	Car Registration,	Mobile,	SMS Consent,	Photo ID Document,	Address ID Document,	Authorised Persons,	Insurance Amount,	Insurance Price,	Insurance Declined,	Insurance Proof Document,	Insurance Type,	DD Name,	DD Sort Code,	DD Account Number,	DD Consent,	DD Declined,	eSignDocumentId,	Optional Extras,	Upfront Payment Amount,	Upfront Transaction ID,	Upfront Transaction Date,	1,	2,	3,
                    // 0        1           2                           3                           4               5               6           7               8           9           10          11      12          13              14              15              16              17              18                  19                  20                      21                      22                          23                          24                          25              26                  27                      28                          29                      30                              31                              32                                  33                                  34                                  35                      36                          37                  38      39              40                  41                      42                  43                  44                  45                  46                          47              48          49              50                  51          52              53                  54                  55                      56                      57                          58  59  60


                    //If this is a Reservation or a Check-In....??
                    //Upfrontpayment amount = [55]
                    //MoveInDate = 


                    //Getting some weird and annoying bug with whitespace and tab chars messing up the data. Seemed to be from a CSV file in MAC numbers format and converted to CSV?
                    for(let i=0; i < current_csv_row.length; i++){
                        let s = current_csv_row[i].trim().replace(/\t/g, '');
                        current_csv_row[i] = s;
                        //console.log(`${i} : ${s}`);
                    }

                    console.log(`Process Row : Customer: ${current_csv_row[ _csv['1 Booking-ID'] ]}: "${current_csv_row[ _csv['9 First-Name'] ]} ${current_csv_row[ _csv['10 Surname'] ]}"`)

                    //TODO: Perhaps use column 0 to do this now - as it has a field to say explicity what the  row represents
                    if(current_csv_row[ _csv['55 Upfront-Payment-Amount'] ] == ""){
                        NewReservation( current_csv_row, g_siteData, g_contactData, (err, result)=>{
                            if (err) {
                                nextCallback(err);
                            } else {
                                //result is: //[{"CustomerID":"RI2168H253100007H000","ReservationID":"RI2168H253100007H002","InvoiceID":"SM000QOF","PaymentID":"SM000QOG"}]
                                //let tmp_result = result[0];          //this returns an array of length 1. So to make the full results array 'nicer' I de reference the first item out of it.
                                //TODO: add some additional fields make tabulation easier....??

                                // TODO: add in the feature to add the phone and email as IContactTypes

                                resultsArray.push(result);     
                                nextCallback(null, resultsArray);
                                
                            }
                        });
                    }else{
                        NewCheckIn( current_csv_row, g_siteData, g_contactData, (err, result)=>{
                            if (err) {
                                nextCallback(err);
                            } else {
                                resultsArray.push(result);     
                                nextCallback(null, resultsArray);                                    
                            }
                        });
                    }
                }
            })),(err, finalResult)=>{ //When the async array of functions either completes with a 'finalResult' or any of the steps produces an error this code executes
                rows_complete(err, finalResult)
            });
        }
    });
}

/**
 * This function processes a reservation row from the CSV File
 * 
 * @param {Array} new_reservation - Array of Customer info taken from a Row in the CSV file
 * @param {Array} _siteData - Array Object representing the site and unit data of the organisation
 * @param {Array} _contactData - Array of organsiation contact type IDs
 * @param {callback} callback_function - error and response
 */
function NewReservation( new_reservation, _siteData, _contactData, callback ){
    // construct the data to send to the WFunction
    let _bookingid = new_reservation[ _csv['1 Booking-ID'] ];
    let _customer_name = `${new_reservation[ _csv['9 First-Name'] ]} ${new_reservation[ _csv['10 Surname'] ]}`;
    let _customer_email = new_reservation[ _csv['11 Email'] ];

    let _site = mmLookup.returnSiteId(new_reservation[ _csv['7 Location-Code'] ], _siteData);
    let _size = mmLookup.returnSizeCode(new_reservation[ _csv['6 Size-Code'] ], _siteData);
    console.log(`NewReservation : LookupIDs: ${_site} : ${_size}`);

    let tmp_amount = _widgets.removeVAT( parseInt(new_reservation[ _csv['3 Reservation-Amount-Paid'] ]) ,0.2);

    let reservation_obj = {
        isite: _site, 
        isurname: new_reservation[_csv['19 Billing-Surname']],
        iforenames: new_reservation[_csv['18 Billing-First-Name']],
        ititle: new_reservation[_csv['17 Billing-Title']],
        iAdd1: new_reservation[_csv['22 Billing-Address-Line-One']],
        iAdd2: new_reservation[_csv['23 Billing-Address-Line-Two']],
        iAdd3: new_reservation[_csv['24 Billing-Address-Line-Three']],
        iTown: new_reservation[_csv['25 Billing-City']],
        iPostcode: new_reservation[_csv['26 Billing-PostCode']],
        iemailaddress: new_reservation[_csv['11 Email']],
        Add1: new_reservation[_csv['32 Correspondance-Address-Line-One']],
        Add2: new_reservation[_csv['33 Correspondance-Address-Line-Two']],
        Add3: new_reservation[_csv['34 Correspondance-Address-Line-Three']],
        Town: new_reservation[_csv['35 Correspondance-City']],
        Postcode: new_reservation[_csv['36 Correspondance-PostCode']],
        // inumber:    req.body.phonenumber.replace('+','%2B'), //TODO: Use the new methods to add this number to the CUSTOMER later on.
        // imovein: _widgets.formatMonthTodayYYYYMMDD(), //new_reservation[33] // need to convert this date to the correct format //TODO: Correct this to one month from now
        imovein: _widgets.formatDateYYYYMMDD(new_reservation[_csv['16 Moving-In-Date']]), //use the date supplied
        isizecode: _size,
        idepositamt: tmp_amount, //new_reservation[3],
        ivatamt: parseInt(new_reservation[_csv['3 Reservation-Amount-Paid']]) - tmp_amount ,
        // ipaymethod: req.body.ipaymethod,
        ipayref: 'creditcard',
        icomment: [new_reservation[_csv['0 Type']], new_reservation[_csv['1 Booking-ID']], new_reservation[_csv['2 Reservation-Transaction-ID']], new_reservation[_csv['4 Container-Size']], new_reservation[_csv['5 Container-ID']], new_reservation[_csv['53 eSignDocumentId']], new_reservation[_csv['56 Upfront-Transaction-ID']], new_reservation[_csv['57 Upfront-Transaction-Date']]].join(', '),
    }
    mm.addCustomerWithReservation(reservation_obj, (err, reservation)=>{
        if(err){
            callback(err);
        }else{
            //result is: //[{"CustomerID":"RI2168H253100007H000","ReservationID":"RI2168H253100007H002","InvoiceID":"SM000QOF","PaymentID":"SM000QOG"}]
            // console.log(reservation);
            let final_result = {};

            final_result["bookingid"] = _bookingid;
            final_result["name"] = _customer_name;
            final_result["email"] = _customer_email;
            final_result["reservation"] = reservation[0];
            final_result["customer"] = { custid:reservation[0].CustomerID };
            final_result["unit"]     = {UnitID:'',UnitNumber:'',UnitNumber:'',SizeCodeID:'',Sizecode:'',Description:`InvoiceID: ${reservation[0].InvoiceID} PaymentID: ${reservation[0].PaymentID}`,Weekrate:'',MonthRate:'',PhysicalSize:'',Height:'',Width:'',Depth:'',ledgeritemid:'',VatCode:'', VATRate:'', };

            final_result["photoid"] = '';
            final_result["photoaddress"] = '';
            final_result["bankaccountID"] = '',
            final_result["contract"] = '';
            final_result["orderid"] = '';

            callback(null, final_result);
        }
    });
}


/**
 * This function processes a new 'check in' row from the CSV File. This function makes many further API calls and calls the other helper functions below in the file.
 * 
 * @param {Array} new_check_in - Array of Customer info taken from a Row in the CSV file
 * @param {Array} _siteData - Array Object representing the site and unit data of the organisation
 * @param {Array} _contactData - Array of organsiation contact type IDs
 * @param {callback} callback_function - error and response
 */
function NewCheckIn( new_check_in, _siteData, _contactData, callback ){
    // console.log( new_check_in[0] );
    // callback(null, new_check_in[0]);

    let _site = mmLookup.returnSiteId(new_check_in[_csv['7 Location-Code']], _siteData);
    let _size = mmLookup.returnSizeCode(new_check_in[_csv['6 Size-Code']], _siteData);
    let _bookingid = new_check_in[_csv['1 Booking-ID']];
    let _customer_name = `${new_check_in[_csv['9 First-Name']]} ${new_check_in[_csv['10 Surname']]}`;
    let _customer_email = new_check_in[_csv['11 Email']];

    console.log(`NewCheckIn : LookupIDs: ${_site} : ${_size}`);

    async([
        (async_callback)=>{
            //(1) Create New Customer. Could also search for existing here.....
            CreateCustomer(new_check_in, _siteData, _contactData, (err,_customer)=>{
                if(err){
                    console.log("Err: CreateCustomer");
                    async_callback(err);
                }else{
                    async_callback(null, { "customer" : _customer[0] }); //again, returns an array of length 1 - so just return the object
                }
            });
        },
        (_data_in,async_callback)=>{
            //(2) Get UnitID. Making a reservation will assign us a UnitID
            mm.getAvaliableUnit(_site, _size, (err,unit)=>{ //TODO: Use the new Utility Here to get the ID for the sizecode
                if(err){
                    console.log("Err: getAvaliableUnit");
                    async_callback(err);
                }else{
                    //console.log(unit);
                    _data_in["unit"] = unit; 
                    if( _data_in.unit ){
                        //console.log(_data_in.unit);
                        async_callback(null, _data_in);
                    }else{
                        async_callback({"Error":"No Units found. Manually Process this one. Look for the customer in the System", "Message":"The SIZECODE attached to this quote/order have all be rented out, but we have more under a different SIZECODE. Please call our office and we can find a comparable unit"});
                    }
                }
            });
        },
        (_data_in,async_callback)=>{
            //(1a) upload image 1
            if(new_check_in[_csv['40 Photo-ID-Document']]!=''){
                console.log(`Image URL: ${new_check_in[_csv['40 Photo-ID-Document']]}`);

                mm.encodeBase64_URI(new_check_in[_csv['40 Photo-ID-Document']], (err, result)=>{
                    if(err){
                        console.log("Error: encodeBase64");
                        _data_in["photoid"] = JSON.stringify(err);
                        async_callback(_data_in);
                    }else{
                        let img_obj = {
                            iCustId: _data_in.customer.custid,
                            iBlob: result.raw, //raw gives success but still no image appearing in the DB
                            iDescription:'Photo ID Document',
                            iFileType:new_check_in[_csv['40 Photo-ID-Document']].split('.').pop()
                        };
                        console.log( `FileType: ${img_obj.iFileType}`);
                        console.log( `ContentType: ${result.content_type}` );

                        mm.InsertOLEDocumentBase64(img_obj,(err, response)=>{
                            if(err){
                                console.log(`Err: InsertOLED : ${ JSON.stringify(err) }`);
                                // _data_in["photoid"] = JSON.stringify(err);//Possibly just return ERROR as a string here....?
                                _data_in["photoid"] = "ERROR";
                                _data_in["err"] = "oled404" ;
                                async_callback(null, _data_in);
                            }else{
                                console.log('InsertOLED Response:')
                                console.log(JSON.stringify(response.body) );
                                // TODO: Check for status 200                              
                                // _data_in["photoid"] = "SUCCESS";
                                _data_in["photoid"] = JSON.stringify(response.body);

                                async_callback(null, _data_in);
                            }
                        });
                    }
                });
            }else{
                _data_in["photoid"] = "none supplied";
                async_callback(null, _data_in);
            }
        },
        (_data_in,async_callback)=>{
            //(1a) upload image 1
            if(new_check_in[_csv['41 Address-ID-Document']]!=''){
                console.log(`Image 2 URL: ${new_check_in[_csv['41 Address-ID-Document']]}`);

                mm.encodeBase64_URI(new_check_in[_csv['41 Address-ID-Document']], (err, result)=>{
                    if(err){
                        console.log("Error: 2 encodeBase64 Address ID");
                        _data_in["photoaddress"] = JSON.stringify(err);
                        async_callback(_data_in);
                    }else{
                        let img_obj = {
                            iCustId: _data_in.customer.custid,
                            iBlob: result.raw, //raw gives success but still no image appearing in the DB
                            iDescription:'Address ID Document',
                            iFileType:new_check_in[_csv['41 Address-ID-Document']].split('.').pop()
                        };
                        console.log( `FileType: ${img_obj.iFileType}`);
                        console.log( `ContentType: ${result.content_type}` );

                        mm.InsertOLEDocumentBase64(img_obj,(err, response)=>{
                            if(err){
                                console.log(`Err: 2 InsertOLED Address : ${ JSON.stringify(err) }`);
                                _data_in["photoaddress"] = "ERROR";
                                _data_in["err"] = "oled404" ;
                                async_callback(null, _data_in);
                            }else{
                                console.log('InsertOLED Response:')
                                console.log(JSON.stringify(response.body) );
                                // TODO: Check for status 200                              
                                // _data_in["photoid"] = "SUCCESS";
                                _data_in["photoaddress"] = JSON.stringify(response.body);

                                async_callback(null, _data_in);
                            }
                        });
                    }
                });
            }else{
                _data_in["photoaddress"] = "none supplied";
                async_callback(null, _data_in);
            }
        },        

        (_data_in,async_callback)=>{          
            //(3) Make reservation from Customer and Unit

            let tmp_amount = _widgets.removeVAT( parseInt(new_check_in[_csv['3 Reservation-Amount-Paid']]), 0.20 );

            let reservation_obj = {
                iCustomerID: _data_in.customer.custid,
                iSite: _site,
                iReservedOn: _widgets.formatTodayYYYYMMDD(),//Date the user made the reservation in the front end. Not in the CSV so I will use today's date!
                iMoveIn: _widgets.formatDateYYYYMMDD(new_check_in[_csv['16 Moving-In-Date']]),
                iUnit: _data_in.unit.UnitID,//can ignore this and let SM make the assignment
                iDepositAmt: tmp_amount,
                iVATAmt:  parseInt(new_check_in[_csv['3 Reservation-Amount-Paid']]) - tmp_amount  ,
                iPaymethod:'C6',    //called 'paymentid' in other SpaceManager functions SMH
                iPayRef:'WorldPay', //called 'paymentref' in other SM functions - sigh
                iComment:[new_check_in[_csv['0 Type']], new_check_in[_csv['1 Booking-ID']], new_check_in[_csv['2 Reservation-Transaction-ID']], new_check_in[_csv['4 Container-Size']], new_check_in[_csv['5 Container-ID']], new_check_in[_csv['53 eSignDocumentId']], new_check_in[_csv['56 Upfront-Transaction-ID']], new_check_in[_csv['57 Upfront-Transaction-Date']]].join(', '),

            }
            console.log("ReservationObj:");
            console.log(reservation_obj);

            mm.MakeReservation(reservation_obj, (err, res_response)=>{
                console.log("ReservationResponse:");
                console.log(err);
                console.log(JSON.stringify( res_response ));
                
                res_obj = res_response[0];//always a single element array from the middelware driver
                if(err){
                    console.log("Err: MakeReservation")
                    async_callback(err);
                }else{
                    if(res_obj.CustomerID && res_obj.ReservationID && res_obj.InvoiceID && res_obj.PaymentID){
                        _data_in["reservation"] = res_obj;
                        async_callback(null, _data_in);
                    }else{
                        async_callback(res_response);
                    }
                }
            });
        },
        (_data_in,async_callback)=>{
            //(4) try and push this to a new order
            console.log("Function: CreateCheckIn");
            CreateCheckIn(new_check_in, _data_in, _site, (err, _contract)=>{
                if(err){
                    console.log("Error: CreateCheckIn");
                    async_callback(err);
                }else{
                    _data_in["contract"] = _contract; //add the result to the results object we have been building.
                    console.log(JSON.stringify( _data_in ))
                    async_callback(null, _data_in); //pass the result to the final handler (below)
                }
            });
        },
        (_data_in, async_callback)=>{
            //(5) Smart Debit stuff.....
            //TODO: Could check here for XX-XX-XX XXXXXXXX in the CSV and not try and send that data....

            console.log("Do Smart Debit?");
            console.log("51 DD-Consent : " + new_check_in[_csv['51 DD-Consent']] );

            if(new_check_in[_csv['51 DD-Consent']] == 'TRUE' || new_check_in[_csv['51 DD-Consent']] == 'true'){
                ProcessSmartDebit( new_check_in, _data_in, (err, _smart_debit)=>{
                    if(err){
                        console.log("Error: ProcessSmartDebit");
                        console.log( err );
                        _data_in['bankaccount'] = JSON.stringify( err );
                    }else{
                        if( _smart_debit && _smart_debit.length>0 && _smart_debit[0] && _smart_debit[0].custpayid ){
                            _data_in['bankaccount'] = _smart_debit[0].custpayid ;
                        }else{
                            _data_in['bankaccount'] = 'ERROR';
                        }
                    }
                    async_callback(null, _data_in);
                });
            }else{
                _data_in['bankaccount'] = 'DENIED';
                async_callback(null, _data_in);
            }

        },
        
    ],(err,final_result)=>{
        if(err){
            //if you see something like// [{"'1'":"1"}]  //then it was the reservation that errored
            console.log("Err: New CheckIn: "+ JSON.stringify(err));
            // callback(err);

            let final_result = {};

            final_result["bookingid"] = new_check_in[_csv['1 Booking-ID']];
            final_result["orderid"] = err.Error;
            final_result["name"] = _customer_name;
            final_result["email"] = _customer_email;

            callback(null, final_result);

        }else{
            console.log(final_result);

            //failed: 'Invalid: SQLState: 00000SQLCode: 0'

            // OK, so an example of a successful response from the SpaceManager backend is not actually JSON. It's:
            // "SQLState: 00000SQLCode: 0ContractID: RI214L1453100"
            // excluding the double-quotes...... Perhaps the middleware could do this step, but for now, we do it here....
            // regex to the rescue


            if(final_result.contract == 'Invalid: SQLState: 00000SQLCode: 0'){
                //callback({"error" : "SpaceManager failed to create contract", "message" : final_result});

                console.log({"error" : {"error" : "SpaceManager failed to create contract", "message" : final_result}} );
                // callback({"error" : "SpaceManager returned an empty ID. Or malformed order string or otherwise failed", "message" : final_result});

                final_result["bookingid"] = new_check_in[_csv['1 Booking-ID']];
                final_result["orderid"] = "SpaceManager failed to create contract. Manually check and complete order.";
                final_result["name"] = _customer_name;
                final_result["email"] = _customer_email;

                callback(null, final_result);

            }else{
                let result_regex = /(SQLState: 00000SQLCode: 0ContractID:)\s([A-Z0-9]{1,20})/g;
                //let orderid = result_regex.exec(final_result.contract)[2];
                let orderid = null;
                let _res_arr = result_regex.exec(final_result.contract);
                if( _res_arr && _res_arr.length > 0 ){
                    orderid = _res_arr[2];
                } else {
                    // the regex above works on my test system. But the response from the demo system in Leeds has a differnt format in the result string!
                    // the above regex expects a single space character \s before the OrderID
                    
                    let result_regex_NEW = /(SQLState: 00000SQLCode: 0ContractID:)([A-Z0-9]{1,20})/g;
                    _res_arr = result_regex_NEW.exec(final_result.contract);
                    if( _res_arr && _res_arr.length ){
                        orderid = _res_arr[2];
                    }
                }

                if( orderid && orderid != ''){
                    final_result["bookingid"] = _bookingid;
                    final_result["orderid"] = orderid;
                    final_result["name"] = _customer_name;
                    final_result["email"] = _customer_email;

                    callback(null, final_result);
          
                }else{
                    //console.log("Ultimate Error Happenned, we should never see this");
                    console.log({"error" : "SpaceManager returned an empty ID. Or malformed order string or otherwise failed", "message" : final_result})
                    // callback({"error" : "SpaceManager returned an empty ID. Or malformed order string or otherwise failed", "message" : final_result});

                    final_result["bookingid"] = new_check_in[_csv['1 Booking-ID']];
                    final_result["orderid"] = "SpaceManager returned an empty ID. Or malformed order string or otherwise failed. Manually check and complete order.";
                    final_result["name"] = _customer_name;
                    final_result["email"] = _customer_email;

                    callback(null, final_result);

                }
            }

        }
    });

}

/**
 * Uses the API to create a new customer inthe system, and passes the new customer ID back via the callback.
 * Will try to add their contact details at this stage too.
 * Will try to add the ASdditional Contact details / person. If they are present.
 * 
 * @param {Array} _data_in - Array of Customer info taken from a Row in the CSV file
 * @param {Array} _siteData - Array Object representing the site and unit data of the organisation
 * @param {Array} _contactData - Array of organsiation contact type IDs
 * @param {callback} callback_function - error and response
 */
function CreateCustomer(_data_in, _siteData, _contactData, callback){
    let _site = mmLookup.returnSiteId(_data_in[_csv['7 Location-Code']], _siteData);
    console.log(`CreateCustomer : LookupIDs: ${_site}`);

    async([
        //step 1 create customer
        function(callback) {
            //create new spaceman user
            mm.addCustomer({
                "idoreturn": 1, //return CustomerID (true / false)
                "isite": _site,//TODO: Use our new functions to get this value
                "isurname": _data_in[_csv['19 Billing-Surname']],
                "iforenames": _data_in[_csv['18 Billing-First-Name']],
                "ititle": _data_in[_csv['17 Billing-Title']],
                "iAdd1": _data_in[_csv['22 Billing-Address-Line-One']],
                "iAdd2": _data_in[_csv['23 Billing-Address-Line-Two']],
                "iAdd3": _data_in[_csv['24 Billing-Address-Line-Three']],
                "iTown": _data_in[_csv['25 Billing-City']],
                "iPostcode": _data_in[_csv['26 Billing-PostCode']],
                "Add1": _data_in[_csv['32 Correspondance-Address-Line-One']],
                "Add2": _data_in[_csv['33 Correspondance-Address-Line-Two']],
                "Add3": _data_in[_csv['34 Correspondance-Address-Line-Three']],
                "Town": _data_in[_csv['35 Correspondance-City']],
                "Postcode": _data_in[_csv['36 Correspondance-PostCode']],
                // "idob": null,
                "inotes": [ _data_in[_csv['0 Type']], _data_in[_csv['1 Booking-ID']], _data_in[_csv['2 Reservation-Transaction-ID']], _data_in[_csv['4 Container-Size']], _data_in[_csv['5 Container-ID']], _data_in[_csv['6 Size-Code']], _data_in[_csv['53 eSignDocumentId']], _data_in[_csv['56 Upfront-Transaction-ID']], _data_in[_csv['57 Upfront-Transaction-Date']], _data_in[_csv['42 Authorised-Persons']], _data_in[_csv['54 Optional-Extras']] ].join(', ') ,
                "iemailaddress": _data_in[_csv['11 Email']],
            }, callback );
        },
        //add mobile phone
        function(_customer, callback){
            //if the above is correct - do a phone number import:
            mm.post_request("/api/v1/base/WManageContact",
                {
                    "icustomerid": _customer[0].custid, 
                    /*"iphoneid":"null",*/ 
                    // "itypeid":"RI16CXRI08022018007O", 
                    "itypeid" : mmLookup.returnContactId('Mobile', _contactData),
                    "inumber": _data_in[_csv['12 Telephone']],
                    "iprimary": 1,
                },(err, _newContact)=>{
                    console.log("[][][][][][] NEW MOBILE [][][][][]");
                    console.log(err);
                    console.log(_newContact);
                    //console.log( _customer[0].custid );

                    callback(null, _customer);
                }
            );
        },
        //add Email
        function(_customer, callback){
            //if the above is correct - do an email address number import:
            mm.post_request("/api/v1/base/WManageContact",
                {
                    "icustomerid": _customer[0].custid, 
                    "itypeid" : mmLookup.returnContactId('Email', _contactData),
                    "inumber": _data_in[_csv['11 Email']],
                    "iprimary": 3,
                },(err, _newContact)=>{
                    console.log("[][][][][][] NEW EMAIL [][][][][]");
                    console.log(err);
                    console.log(_newContact);
                    //console.log( _customer[0].custid );

                    callback(null, _customer);
                }
            );
        },
        //add Email Answer
        function(_customer, callback){
            mm.post_request("/api/v1/base/WSetQuestAnswer",
                {
                    "tlocation": "C1", 
                    "tid":"PDF",
                    "parentid": _customer[0].custid, 
                    "tvalue":1
                },(err, _newQuest)=>{
                    console.log("[][][][][][] NEW EMAIL ANSWER [][][][][]");
                    console.log(err);
                    console.log(_newQuest);
                    //console.log( _customer[0].custid );

                    callback(null, _customer);
                }
            );
            //Need to run WSetQuestAnswer : Was told to use these values. Customer specfic
            //tlocation = 'C1'
            //tid = 'PDF'
            //tchoiceid = 'YES'
            //parentid = custid
            //tvalue = 1
        },        
        //add authorised persons
        function(_customer, callback){
            //if the fiels is not empty:

            if(_data_in[_csv['42 Authorised-Persons']] != ''){ //Authorised Persons field
                let AuthPerson = JSON.parse(_data_in[_csv['42 Authorised-Persons']]);
                console.log( "AuthPerson:" );
                console.log( AuthPerson );
                //[{"title":"Miss","firstName":"Alex","surname":"Smith","emailAddress":"alexsmith@gmail.com","addressLineOne":"10 Roseville Road","addressLineTwo":"","addressLineThree":"","city":"Leeds","postCode":"LS12 4HP","carRegistration":"","mobile":"01134269111","notified":"1","isPrimaryContact":"1","isAuthorisedForAccess":"1","isAuthorisedForAccount":"1"}]
                mm.post_request("/api/v1/base/WAddPerson",
                    {
                        "icustomerid": _customer[0]?.custid, 
                        "isurname": AuthPerson[0]?.surname,                    // *isurname               char(50)
                        "iforenames": AuthPerson[0]?.firstname,                    // iforenames              char(50)
                        "ititle": AuthPerson[0]?.title,                    // ititle                  char(50)
                        "Add1": AuthPerson[0]?.addressLineOne,                    // Add1                    char(50)
                        "Add2": AuthPerson[0]?.addressLineTwo,                    // Add2                    char(50)
                        "Add3": AuthPerson[0]?.addressLineThree,                    // Add3                    char(50)
                        "iTown": AuthPerson[0]?.city,                    // iTown                   char(50)
                        "iCounty":"",                    // iCounty                 char(50)
                        "iPostcode":AuthPerson[0]?.postCode,                    // iPostcode               char(20)
                        "iCountry":"",                    // iCountry                char(3)
                        "iJobTitle":"",                    // iJobTitle               char(50)
                        "iPrimaryContact":AuthPerson[0]?.isPrimaryContact,                    // iPrimaryContact         integer
                        "iAuthorised":AuthPerson[0]?.isAuthorisedForAccess,                    // iAuthorised             integer
                        "iAuthorisedForAccount":AuthPerson[0]?.isAuthorisedForAccount,                    // iAuthorisedForAccount   integer
                        "idoreturn":1,                    // idoreturn               integer
                    },(err, _newPerson)=>{
                        console.log("[][][][][][] ADD PERSON [][][][][]");
                        console.log(err);
                        console.log(_newPerson);
                        //console.log( _customer[0].custid );

                        callback(null, _customer);
                    }
                );
            }else{
                callback(null, _customer);
            }
        },

    ], function(err, data){

        //for now send back the old style customer array, but could refactor this to be the new object of customer and contacts.
        callback(err, data);
    });
}

/**
 * The main function that does the 'check in' by creating a new order in the StorageManager system via the MiddleManager application.
 * This function calls a MiddleManager API function, that makes use of multiple WFunctions behind the scenes.
 * 
 * @param {Array} _new_check_in - Array of Customer info taken from a Row in the CSV file
 * @param {Array} _data_in - Object containing all infor about the current order. The customer the reserved unit etc
 * @param {string} _siteID - The selected site
 * @param {callback} callback - error and response
 */
function CreateCheckIn(_new_check_in, _data_in, _siteID, callback){
    console.log(`CreateCheckIn : LookupIDs: ${_siteID}`);

    let _monthRate = _widgets.convertWtoM( parseInt(_new_check_in[_csv['13 Weekly-Price']]) );
    let _tmp_amount = _widgets.removeVAT( parseInt(_new_check_in[_csv['3 Reservation-Amount-Paid']]), 0.2 );
    let _insure = 'FALSE';
    let _insureid = 'I1';
    let _goodsvalue = parseInt(_new_check_in[_csv['43 Insurance-Amount']]);

    //Checking for the fields that determine if the customer wants insurance?
    console.log(`Insurance-Declined: '${ _new_check_in[_csv['45 Insurance-Declined']] }'  Insurance-Type: '${ _new_check_in[_csv['47 Insurance-Type']] }'`);
    if(   (_new_check_in[_csv['45 Insurance-Declined']]== 'FALSE' || _new_check_in[_csv['45 Insurance-Declined']]== 'false' )  &&  (_new_check_in[_csv['47 Insurance-Type']] == 'ACCEPTED' || _new_check_in[_csv['47 Insurance-Type']] == 'accepted')   ){
    // if(1==1){
        _insure = 'TRUE';
        // This is some business logic based onthe bands of insurance used - needed a new WFunction on the server side. Plus the ledgeritems witrh these names need to exist...
        switch(_goodsvalue){
            case(_goodsvalue <= 1000):
                _insureid = 'I1';
                break;
            case(_goodsvalue <= 2000):
                _insureid = 'I2';
                break;
            case(_goodsvalue <= 3000):
                _insureid = 'I3';
                break;
            case(_goodsvalue <= 5000):
                _insureid = 'I5';
                break;
            case(_goodsvalue <= 7000):
                _insureid = 'I7';
                break;
            case(_goodsvalue <= 9000):
                _insureid = 'I9';
                break;
            case(_goodsvalue <= 10000):
                _insureid = 'I10';
                break;

            // case(_goodsvalue > 10000):
            //     _insureid = 'I11';
            //     break;

            default:
                _insureid = 'I1';
        }
    }

    let order_details = {
        customerid:         _data_in.customer.custid, //This terrible naming of the custid is what the WFunction returns
        siteid:             _siteID,
        unitid:             _data_in.unit.UnitID,
        ireservationid:     _data_in.reservation.ReservationID,
        startdate:          _widgets.formatDateYYYYMMDD(_new_check_in[_csv['16 Moving-In-Date']]),
        chargetodate:       _widgets.smartDebit_formatMonthTodayYYYYMMDD(_new_check_in[_csv['16 Moving-In-Date']]), // there is some specfic logic for DD that can be used here too
        invoicefrequency:   1,
        invfreqtype:        'M',//CSV rates come in weekly format, but the business wants to bill in M
        rateamount:         _monthRate,
        depositamount:      _tmp_amount,
        amount:             _new_check_in[_csv['55 Upfront-Payment-Amount']]/100,  //TODO: Does this need to be -5 (minus 5) as £5 went to the reservation?
        vatcode:            _data_in.unit.VatCode,
        paymentid:          'C6',
        paymentref:         'WorldPay',
        insure:             _insure,
        insuresku:           _insureid,
        insurerate:          _new_check_in[_csv['44 Insurance-Price']],
        goodsvalue:         _goodsvalue,
        salesitems:         _new_check_in[_csv['54 Optional-Extras']], //The test items in the CSV had whitespace around the SKU - probably an issue in the data coming from the CSV export tool
        notes:              '', // TO BIG NO POINT //[_new_check_in[42], _new_check_in[0], _new_check_in[1], _new_check_in[4],_new_check_in[5],_new_check_in[6], _new_check_in[53], _new_check_in[56], _new_check_in[57], _new_check_in[37] ].join(', ') ,

    };
    //console.log(order_details);
    mm.CSV_CheckIn(order_details, callback);
}

/**
 * This function will send the customer details to the Smart Debit API to initiate the processes needed for Direct Debit payments for the customer in the future.
 * 
 * @param {Array} _customer_in - Array of Customer info taken from a Row in the CSV file
 * @param {Array} _data_in - Current order obnject with customer IDs 
 * @param {callback} callback_function - error and response
 */
function ProcessSmartDebit(_customer_in, _data_in, callback){
    console.log("Function: ProcessSmartDebit");

    let server_url = process.env.SMART_DEBIT_URL;
    let api_validate = '/api/ddi/variable/validate';
    let api_create = '/api/ddi/variable/create';

    let _pslid = process.env.SMART_DEBIT_PSLID;
    let _sd_username = process.env.SMART_DEBIT_USERNAME;
    let _sd_password = process.env.SMART_DEBIT_PASSWORD;

    let _SC = ''; let _AN = ''; let _L4D = '';

    if(process.env.SMART_DEBIT_STATUS==='sandbox'){
        _SC = '000000';
        _AN = '12345678';
        _L4D = Math.floor(Math.random()*(9999-1000+1)+1000);
    }else{
        _SC = _customer_in[_csv['49 DD-Sort-Code']];
        _AN = _customer_in[_csv['50 DD-Account-Number']];
        _L4D = _AN.substring(4,8);
    }

    //this is the first three letters of the first and last names and the last four digits of the account number!
    let ddi_ref = `${_customer_in[_csv['18 Billing-First-Name']].substring(0,3).toUpperCase()}${_customer_in[_csv['19 Billing-Surname']].substring(0,3).toUpperCase()}${_L4D}`

    let payload={
        'variable_ddi[sort_code]': _SC,
        'variable_ddi[account_number]': _AN,
        'variable_ddi[reference_number]': ddi_ref,
        'variable_ddi[first_name]': _customer_in[_csv['18 Billing-First-Name']],
        'variable_ddi[last_name]': _customer_in[_csv['19 Billing-Surname']],     //#csv_in['Billing First Name'][i]
        'variable_ddi[address_1]': _customer_in[_csv['22 Billing-Address-Line-One']].replace(/,/g, '.'),  // <error>Address 1 only letters, numbers, spaces, hyphens, forward slash, ampersand and full stops are permitted in address 1</error> // no commas!
        'variable_ddi[town]': _customer_in[_csv['25 Billing-City']],
        'variable_ddi[postcode]': _customer_in[_csv['26 Billing-PostCode']],
        'variable_ddi[country]': 'UK',  //TODO: There is no CSV data with the country!?
        'variable_ddi[account_name]': _customer_in[_csv['48 DD-Name']].substring(0,18), // <error>Account name is too long (maximum is 18 characters)</error> //API errors!
        'variable_ddi[service_user][pslid]': _pslid,
        'variable_ddi[frequency_type]': 'M',
        'variable_ddi[default_amount]': '0',
        //#'Variable_ddi[first_amount]': '50',
        'variable_ddi[payer_reference]': ddi_ref,
        //TODO: choose a better time here
        'variable_ddi[start_date]': widgets.smartDebit_formatMonthTodayYYYYMMDD(_customer_in[_csv['16 Moving-In-Date']]) ,
        //#'variable_ddi[end_date]': '{{validate_adhoc_end_date}}', //these curly brackets items come straight from the XML widget in the Desktop SM app, and were commented out there, so I have left them commented here too
        //#'variable_ddi[title]': '{{validate_adhoc_title}}',
        //#'variable_ddi[address_2]': '{{validate_adhoc_address2}}',
        //#'variable_ddi[address_3]': '{{validate_adhoc_address3}}',
        //#'variable_ddi[county]': '{{validate_adhoc_county}}',
        'variable_ddi[email_address]': _customer_in[_csv['11 Email']],
        //#'variable_ddi[promotion]': '{{validate_adhoc_promotion}}',
        //#'variable_ddi[company_name]': '{{validate_adhoc_company_name}}'
    }


    async([
        //step 1 validate customer DD
        function(a_callback) {
            console.log("SmartDebit: Validate");
            console.log(payload);

            //We dont use needle here as there were headers it didnt like (it is very strict apparently?) so we use the request method as per the smartdebit docs

            // Alternative way to sent the auth details
            // var auth = 'Basic ' + Buffer.from(_sd_username + ':' + _sd_password).toString('base64');

            var options = {
                'method': 'POST',
                'auth': {
                    'user': _sd_username,
                    'pass': _sd_password,
                    'sendImmediately': true,
                },
                'url': `${server_url}${api_validate}`,
                'headers': {
                  'Content-Type': 'application/x-www-form-urlencoded',
                //   'Authorization': auth,
                },
                formData: payload
            };

            request(options, (err, res)=>{
                // if (error) throw new Error(error);
                // console.log(response.body);
                console.log(`${server_url}${api_validate}`);
                // console.log("err");
                // console.log(err);
                // console.log("res");
                // console.log(res);
                // console.log("res end");

                //console.log(res.body)

                if (err) {
                    console.log("SmartDebit : Request: Err:");
                    a_callback(err);
                } else if (res.statusCode != 200) {
                    a_callback({
                        "error": "Not Found SD Validate",
                        "type": "404",
                        "number": 404,
                        "body":res.body,
                    });
                } else if (res.body.error) {
                    a_callback(res.body);
                } else {//success?
                    console.log("SmartDebit : Request...");
                    console.log(res.body);
                    parseXML(res.body, (err, result)=>{
                        if(err){
                            a_callback(err);
                        }else{
                            //console.dir(result);
                            if(result.successful){
                                //console.dir(result.successful.success[2]);
                                a_callback(null, result);
                            }else{
                                a_callback(result);
                            }
                        }
                    });
                }                
            });
        // {  //result.successful.success[2] = 
        //     '$': {
        //       bank_name: 'HSBBC BANK PLC',
        //       branch: 'Broadway',
        //       address1: '32 Bridge St',
        //       address2: '',
        //       address3: '',
        //       address4: '',
        //       town: 'Evesham',
        //       county: 'Worcs.',
        //       postcode: 'WR11 4RU'
        //     }
        //   }

        },     
        //authorise the DD and create it
        function(_sm_debit, a_callback){
            console.log("SmartDebit: Create");

            var options = {
                'method': 'POST',
                'auth': {
                    'user': _sd_username,
                    'pass': _sd_password,
                    'sendImmediately': true,
                },                
                'url': `${server_url}${api_create}`,
                'headers': {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                formData: payload
            };

            request(options, (err, res)=>{
                // if (error) throw new Error(error);
                // console.log(response.body);
                console.log(`${server_url}${api_create}`);
                // console.log("err");
                // console.log(err);
                // console.log("res");
                // console.log(res);
                // console.log("res end");

                if (err) {
                    console.log("SmartDebit : Create : Error: ");
                    a_callback(err);
                } else if (res.statusCode != 200) {
                    a_callback({
                        "error": "Not Found SD Create",
                        "type": "404",
                        "number": 404,
                        "body":res.body,
                    });
                } else if (res.body.error) {
                    a_callback(res.body);
                } else { //win!?
                    console.log(res.body);
                    //If we are here the validate was OK, so now assuming everything works, we can add the bank account
                    parseXML(res.body, (err, result)=>{
                        if(err){
                            a_callback(err);
                        }else{
                            //console.dir(result);
                            if(result.variable_ddi){
                                //console.dir(result.successful.success[2]);
                                // a_callback(null, result);
                                //ADDBANKACCOUNT if the DD stuff worked!#

                                mm.post_request("/api/v1/base/WAddBankAccount",
                                {
                                    "icustomerid": _data_in.customer.custid, 
                                    "ipaymethodid":"C7", //Hard coded, need a WFunction,. or just to know what these are! C5 Does not work!!
                                    "iaccountname" : ddi_ref, //making this the DDIREF from the SmartDebit API, but I dont know what these values should be. Consult Elisabeth?
                                    "iaccountno": _AN,
                                    "isortno": _SC,
                                    "ibacsref": ddi_ref,
                                    "idefault":1,
                                    "iddreturned":1, //not sure what this is, but seems to need to be 1!! perhaps its the customer permission? or its the the 'mandate printed'?
                                    "ibankname":_sm_debit.successful.success[2].$.bank_name,
                                    "ibankaddress":_sm_debit.successful.success[2].$.address1,
                                    "ibanktown":_sm_debit.successful.success[2].$.town,
                                    "ibankcounty":_sm_debit.successful.success[2].$.county,
                                    "ibankpostcode":_sm_debit.successful.success[2].$.postcode,

                                },(err, _newBankAccount)=>{
                                    console.log("[][][][][][] NEW BANK ACCOUNT [][][][][]");
                                    console.log(err);
                                    console.log(_newBankAccount);
                                    if(err){
                                        a_callback(err);
                                    }else{
                                        a_callback(null, _newBankAccount);
                                    }
                                });
                            }else{
                                a_callback(result);
                            }
                        }
                    });
                }                
            });

        },

    ], function(err, data){
        callback(err, data);
    });

}

module.exports = router;