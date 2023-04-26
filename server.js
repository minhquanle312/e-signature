const mongoose = require('mongoose')
const { Server } = require('socket.io')
const dotenv = require('dotenv')

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION 💥💥💥 Shuting down ...')
  console.log(err.name, err.message)
  process.exit(1)
})

dotenv.config({ path: './config.env' })

const app = require('./app')

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
)

mongoose.connect(DB).then(con => {
  console.log('DB connection successful')
})

const port = process.env.PORT || 3000
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`)
})

// // * Socket.io
// const io = new Server(server, {
//   cors: {
//     origin: '*',
//   },
// })

// io.on('connection', socket => {
//   socket.on('get-chat-room', chatId => {
//     // const data = ''
//     socket.join(chatId)
//     // socket.emit('load-chat-room', data)

//     socket.on('send-message', data => {
//       socket.to(chatId).emit('receive-message', data)
//     })
//   })
// })

// process.on('uncaughtException', err => {
//   console.log('UNHANDLER REJECTION 💥💥💥 Shuting down ...')
//   console.log(err.name, err.message)
//   serverRunning.close(() => {
//     process.exit(1)
//   })
// })
