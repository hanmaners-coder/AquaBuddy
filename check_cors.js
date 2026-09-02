const https = require('https');

const KEY = '8Vbb5%2BdWRNC4Axr8zc6rPuhLMQEm4Bxp6jTu9lyktrYc4a8KqanQRtb7KkgfnQ7fzsuQEJ%2Bl34wZAAqUIoRuMg%3D%3D';
const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const url = `https://apis.data.go.kr/1192136/fcstSkinScubav2/GetFcstSkinScubaApiServicev2?serviceKey=${KEY}&placeCode=SS9&reqDate=${d}&type=json`;

const req = https.get(url, (res) => {
    console.log("Status Code:", res.statusCode);
    console.log("Headers:", res.headers);
});
