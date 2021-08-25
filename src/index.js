const path = require('path')
const http = require('http')
const express = require('express')
const scoketio = require('socket.io')
const Filter = require('bad-words')
const hbs = require('hbs')
const { title } = require('process')
const {
    generateMessage,
    generateLocationMessage} = require('./utils/messages')
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = scoketio(server)

const port =  process.env.PORT || 3000
const publicDirectoryPath= path.join(__dirname,'../public')
const viewsPath = path.join(__dirname,'../templates/views')
const partialPath =path.join(__dirname,'../templates/partials')



app.set('view engine','hbs')
app.set('views',viewsPath)

//hbs.registerPartial(partialPath)

app.use(express.static(publicDirectoryPath))

io.on('connection',(socket)=>{

    console.log('New WebsScoket connection')

    socket.on('join',(options,callback)=>{
        
        const { error,user } = addUser({id:socket.id,...options})
       
        if(error){

            return callback(error)
        }

        socket.join(user.room)

        //io.to.emit
        //socket.broadcast.to.emit


        socket.emit('message', generateMessage('Admin','WELCOME TO THE CHAT APP'))
        //SEND MESSAGE WHEN NEW USER IS CONNECTED 
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
    })
  
     socket.on('sendMessage',(message, callback)=>{


        const user  = getUser(socket.id)
       
        if(!user){

            return callback("Error: Not stored user")
        }

        
        console.log(getUser(socket.id))
        const filter = new Filter()

         if(filter.isProfane(message)){
             return callback('Profanity is not allowed')
         }
         if(message.length===0){
            return callback('Empty message not allowed')
         }
         io.to(user.room).emit('message',generateMessage(user.username,message))
         callback() 
     })

     socket.on('sendLocation',(coords,callback)=>{
        const user  = getUser(socket.id)
       
        if(!user){

            return callback("Error: Not stored user")
        }
        

        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,coords))

        callback()
    })
     //SEND MESSAGE WHEN USER IS DISCONNECTED
     socket.on('disconnect',()=>{

       const user = removeUser(socket.id)
        
       if(user){
        io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
       }
       //io.emit('message',generateMessage('A user has left!'))
       
     })



})

server.listen(port,()=>{

    console.log(`SERVER IS  UP ON PORT ${port}`)
})



