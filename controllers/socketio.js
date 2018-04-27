let msgp = document.getElementById('msgp')
let socket = io()
socket.emit('greeting', "Hi")

socket.on('greeting', (msg) => {
  console.log(msg)
})

socket.on('char', (msg) => {
  DM.assets.speed += 0.1
})
