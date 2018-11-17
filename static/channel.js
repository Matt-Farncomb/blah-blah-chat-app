
//NOTES: Won't regeister a change unless actual new code is added ratehr than just ccommenting out some stuff

document.addEventListener('DOMContentLoaded', () => {
    console.log("test")

  /*  const saveName = document.querySelector('#save-name');*/
    const channel = document.querySelector('#channels');
    const chanName = document.querySelector('#chan-name');
    const saveChan = document.querySelector('#save-chan');
    const msgBox = document.querySelector('#msg');
    /*const name = document.querySelector('#input-name');*/

    let targeting = false;
    let target = ""

    let usr_name = "unnamed"


    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);


    function sendMessage() {
        
        let msgText = msgBox.value
        socket.emit('send message', {'message': msgText});
        msgBox.value = "";
        console.log("is doing something");
    }

    function saveChannel() {
        socket.emit('send create', {'chanName': chanName.value.toLowerCase()});
        chanName.value = ""
       /* chanName.hidden = true;        
        saveChan.hidden = true;*/
    }


    // When connected...
    socket.on('connect', () => {
        
        socket.emit('which channel');
    





     /*   document.querySelector('#blah').onclick = () => {
            sendMessage()
      
        };*/

         msgBox.addEventListener('keydown', (e) => {
            if (e.key == "Enter") {
                sendMessage()
                //stops enter making a line break
                e.preventDefault();
            }
        });

         msgBox.addEventListener('keydown', (e) => {
            if (e.key == "@") {
               /* msgBox.value += "@"*/
                /*console.log("@ detected")*/
                msgBox.style.color = "blue";
                targeting = true;
            }
            else if (e.code === "Space" && targeting === true) {
                console.log("Space Detected");
                temp = msgBox.value
                /*temp = msgBox.value.split("");
                temp = temp.slice(1,temp.length).join("")*/
                target = msgBox.value.slice(1,temp.length);
                console.log(target);

                socket.emit('check', target)
                /*location = `http://127.0.0.1:5000/channels/${target}`*/
                msgBox.style.color = "#CCE4FF"
                msgBox.value = ""
                targeting = false
/*socket.emit('send create', {'chanName': chanName.value.toLowerCase()});*/

            }
         });



        /*saveChan.onclick = () => saveChannel();*/
                     
        chanName.addEventListener('keydown', (e) => {
             if (e.key == "Enter") {
                saveChannel()   
             }
        });       
        
    });

    // When a new message is announced, append to DOM
    socket.on('broadcast message', message => {
        const li = document.createElement('li')

        new_msg = `<span id="${message.id}"><span class="names">${message.name}:</span> ${message.message}</span>`
        li.innerHTML = new_msg
        document.querySelector('#msg-room').append(li);
    });

    socket.on('delete msg', id => {
        console.log(`id=${id}`)
        old_msg = document.getElementById(`${id}`).parentNode;
        /*old_msg.parentNode.removeChild(old_msg);*/
        old_msg.style.display = 'none';
    });

    socket.on('create channel', chanName => {
        const sp = document.createElement('span')
        jc = document.querySelector('#jinja_channels');
        sp.innerHTML = `<li class="channel-links">
                            <a href="/channels/${chanName}" class="nav-link">${chanName}
                        </li>`;
        jc.appendChild(sp)

    });

    socket.on('swap channel', value => {
        console.log(`this is my value: ${value}`);
        location = `http://127.0.0.1:5000/channels/${value}`
    })

    socket.on('user entered', value => {
        console.log(`User Entered ${value}`)
    })

    socket.on('update users', value => {
        console.log(`updating users: ${value.name}`)
        console.log(`updating channel: ${value.chan}`)
        userChan = document.querySelector(`#cur-chan-${value.name}`)
        userChan.innerText = value.chan
    })




});
