
//NOTES: Won't regeister a change unless actual new code is added ratehr than just ccommenting out some stuff


document.addEventListener('DOMContentLoaded', () => {
    console.log("test")

  /*  const saveName = document.querySelector('#save-name');*/
    const channel = document.querySelector('#channels');
    const chanName = document.querySelector('#chan-name');
    const saveChan = document.querySelector('#save-chan');
    /*const name = document.querySelector('#input-name');*/

    let usr_name = "unnamed"

    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    // When connected...
    socket.on('connect', () => {

        document.querySelector('#blah').onclick = () => {
            let message = document.querySelector('#msg');
            let msg_text = message.value
            socket.emit('send message', {'message': msg_text});
            message.value = "";
            /*return false;*/
        };

         document.querySelector('#save-chan').onclick = () => {

            console.log("save chan test");
            
            socket.emit('send create', {'chanName': chanName.value.toLowerCase()});

            chanName.hidden = true;        
            saveChan.hidden = true;
            
        };
    });

    // When a new message is announced, append to DOM
    socket.on('broadcast message', message => {
        const li = document.createElement('li')
/*        li.innerHTML = message
        document.querySelector('#msg-room').append(li);*/
/*        console.log(message.msg_obj)*/

        new_msg = `<span id="${message.id}">${message.name}:${message.message}</span>`
        li.innerHTML = new_msg
        document.querySelector('#msg-room').append(li);
    });

    socket.on('delete msg', id => {
        console.log(`id=${id}`)
        old_msg = document.querySelector(`#${id}`).parentNode;
        /*old_msg.parentNode.removeChild(old_msg);*/
        old_msg.style.display = 'none';
    });

});
