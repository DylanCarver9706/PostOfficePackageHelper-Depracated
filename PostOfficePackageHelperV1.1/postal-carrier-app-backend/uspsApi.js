const axios = require('axios').default;
const xmlbuilder2 = require('xmlbuilder2');

let root = xmlbuilder2.create({ version: '1.0'})
        .ele('AddressValidateRequest', { USERID: '177PERSO17Q97' })
            .ele('Address')
                .ele('Address1').txt('185 Berry St').up()
                .ele('Address2').txt('Suite 6100').up()
                .ele('City').txt('San Francisco').up()
                .ele('State').txt('CA').up()
                .ele('Zip5').txt('94556').up()
            .ele('Zip4').up()
        .up()

 let xml = root.end({ prettyPrint: true });
let url = 'https://secure.shippingapis.com/ShippingAPI.dll?API=Verify&xml=' + encodeURIComponent(xml);

axios.get(url)
 .then(function (response) {
const obj = xmlbuilder2.convert(response.data, { format: "object" });
  console.log(obj);
  })
  .catch(function (error) {
    console.log(error);
  });