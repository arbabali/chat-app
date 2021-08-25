const socket = io()
// Eleements

const $messageForm = document.querySelector('#message-form') 
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
//Templates

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username,room}= Qs.parse(location.search, { ignoreQueryPrefix: true } )

const autoscroll = () =>{
    //new message element

    const $newMessage = $messages.lastElementChild


    // height of new message 
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight +  newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    // height of messages container

    const containerHeight = $messages.scrollHeight

    // How far have I scrolled 

    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset){

        $messages.scrollTop = $messages.scrollHeight
    }



}
socket.on('message',(message)=>{
    //console.log(message)
    const html = Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm:ss a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(message)=>{

    //console.log(message)
    const html = Mustache.render(locationTemplate,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm:ss a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',(data)=>{

    const html = Mustache.render(sidebarTemplate,{
        room:data.room,
        users:data.users
    })
    console.log(html)
    document.querySelector("#sidebar").innerHTML = html
})


$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()

    // disable
    $messageFormButton.setAttribute('disabled','disabled')
    //const message = document.querySelector('#messageInput').value
    const message = e.target.elements.messageInput.value
    socket.emit('sendMessage', message, (error) => {
        // re enable
        $messageFormButton.removeAttribute('disabled')

        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error){
            return console.log(error)
        }
        console.log('The message was delivered!')
    })
})


$sendLocationButton.addEventListener('click',()=>{


    if (!navigator.geolocation ) 
    {
        return alert('GEOLOCATION IS NOT SUPPORTED IN YOUR BROWSER')
    }
    
    // disable 
    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position)=>{

        //console.log(position)

        socket.emit('sendLocation',{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },()=>{
            // disable 
            $sendLocationButton.removeAttribute('disabled')
    
            console.log("the location was shared!")
        })
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
    alert(error)
    location.href = '/'
        }
})
//server(emit)->client(recieve) -- acknowledgment -> server

//client(emit)->server(recieve) --acknowledgment -> client