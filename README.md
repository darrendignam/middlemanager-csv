# middlemanager-csv

This app can process CSV files into the middlemanager middleware

## Example .env file (example values too)
```
PORT=3000
NODE_ENV='development'
ENV_SPACE='middlemanager'
MIDDLEMANAGER_URL='127.0.0.1:3001'
MIDDLEMANAGER_TOKEN='54321'

SMART_DEBIT_STATUS='sandbox'
SMART_DEBIT_URL='https://sandbox.ddprocessing.co.uk'
SMART_DEBIT_PSLID='pslid_test'
SMART_DEBIT_USERNAME='name_test'
SMART_DEBIT_PASSWORD='pass_test!'
```

## Response Errors:
If the API request cannot be made, because the API server times out (or the connection details are incorrect) the following error is passed to the callback. You may not want to present these errors in a live system, but can be used when debugging new installations.

Cannot find host:
```
Error: connect EHOSTUNREACH 192.168.1.15:3000
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1129:16) 
{
  errno: -113,
  code: 'EHOSTUNREACH',
  syscall: 'connect',
  address: '192.168.1.15',
  port: 3000
}
```
Or this DNS failure error.
```
Error: getaddrinfo ENOTFOUND mm.tickertape.cc
    at GetAddrInfoReqWrap.onlookup [as oncomplete] (node:dns:67:26) 
{
  errno: -3008,
  code: 'ENOTFOUND',
  syscall: 'getaddrinfo',
  hostname: 'mm.tickertape.cc'
}
```


It is possible to send a request to an unknown URL endpoint at the API, in that case a typical error could look like:
API sends a 404 error:
```
{
    "error":"Not Found",
    "type":"404",
    "number":404
}
```

API server does not recognise the function or endpoint - this is similar to a 404 but rather than respond with an empty result object an error is reported.
```
{
    "error": "Unknown Function Call",
    "type": "POST function error"
}
```

The SAP Driver running on the middleware is not responding. Either the service crashed or didnt come up with the server.
```
{
    "error": "Error: Code: -2004 Msg: Can't initialize DBCAPI",
    "type": "connection"
}
```

### More on errors
It is always a good practice to sanity check the response to make sure it what you expect. Perhaps the http response is 200 but the message body is not JSON, but text from the apache or nginx server or proxy between yoy and the API.