const fs = require('fs');
const bcrypt = require('bcryptjs')

const plain = 'Arsh@12145'

bcrypt.hash(plain, 10).then(res => {
    fs.writeFileSync('full_hash.txt', res);
    console.log("Hash written to file.");
})
