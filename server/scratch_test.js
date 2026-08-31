const axios = require('axios');
axios.post('http://localhost:5000/api/auth/login', {
    email: 'tamilarasuv006@gmail.com',
    password: 'password'
}).then(res => console.log(res.data)).catch(err => console.log(err.response.data));
