const bcrypt = require('bcryptjs')

const dbHash = '$2b$10$GA.kRErLLXydI26XjJZHVZG4H/Zsq6f998GeM90yLJ'
const plain = 'Arsh@12145'

bcrypt.compare(plain, dbHash).then(res => {
    console.log("Does 'Arsh@12145' match the DB hash?", res)
})
