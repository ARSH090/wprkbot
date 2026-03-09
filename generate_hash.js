const bcrypt = require('bcryptjs')

const plain = 'Arsh@12145'

bcrypt.hash(plain, 10).then(res => {
    console.log("Newly Generated Hash:", res)
})
