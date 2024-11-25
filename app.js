const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const app = express()
const dbPath = path.join(__dirname, 'userData.db')
app.use(express.json())
module.exports = app
let db = null
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server is running')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

//API 1

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * FROM user 
    WHERE username='${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400).send('Password is too short')
    } else {
      const createUserQuery = `
        INSERT INTO user(username,name,password,gender,location)
        VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}')`
      await db.run(createUserQuery)
      response.status(200).send('User created successfully')
    }
  } else {
    response.status(400).send('User already exists')
  }
})

//API 2

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user 
    WHERE username='${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400).send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.status(200).send('Login success!')
    } else {
      response.status(400).send('Invalid password')
    }
  }
})

//API 3

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `SELECT * FROM user 
    WHERE username='${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400).send('Invalid user')
  } else {
    isoldPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password)
    if (isoldPasswordMatched === true) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10)
        const updatePasswordQuery = `
        UPDATE user
        SET password='${encryptedPassword}'
        WHERE username='${username}'`
        await db.run(updatePasswordQuery)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
