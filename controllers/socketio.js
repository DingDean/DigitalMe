let msgp = document.getElementById('msgp')
let socket = io()
socket.emit('greeting', "Hi")

socket.on('greeting', (msg) => {
  console.log(msg)
})

socket.on('char', (msg) => {
  lastInput = clock.getElapsedTime()
  intensity += 0.0005
  if ( intensity > 0.005 )
    intensity = 0.005
})
