var axios = require('axios');
var qs = require('qs');
var data = qs.stringify({
 'grant_type': 'client_credentials',
'client_id': 'cli-ser-gpf',
'client_secret': '07c7b9c9-ee4e-4d22-a978-718d8727ebd4' 
});
var config = {
  method: 'post',
  url: 'https://login.des.caixa/auth/realms/intranet/protocol/openid-connect/token/',
  headers: { 
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  data : data
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});
