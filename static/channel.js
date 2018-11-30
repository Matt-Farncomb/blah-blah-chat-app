
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
    console.log(location);

    //Grabs current channel name from url
    curChanPath = location.pathname.split('/')
    curChan = curChanPath[2]
    let target = ""

    let usr_name = "unnamed"

    const columns = document.querySelectorAll('.col-4');
    let focused = false;
    let focus = `msg-room-${curChan}`;


    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    function sendMessage() {
        
        let msgText = msgBox.value
        //don't allow an empty msg to send
        if (msgText.length > 0) {
            socket.emit('send message', {'message': msgText});
            msgBox.value = "";
            console.log("is doing something");
        }
    }

    function saveChannel() {
        socket.emit('send create', {'chanName': chanName.value.toLowerCase()});
        chanName.value = ""
       /* chanName.hidden = true;        
        saveChan.hidden = true;*/
    }

    const chanNavs = document.querySelectorAll(".chan-nav-btn");
    console.log("ha");



    chanNavs.forEach((chanNav) => {
        chanNav.addEventListener('click', () => {
            let linkId = 1.0;
            const chanNavId = parseFloat(chanNav.id.slice(4));
            //`link-${temp}`
            const chanLinks = document.querySelectorAll(".channel-links");
            chanLinks.forEach((chanLink) => {
                linkId = parseFloat(chanLink.id.slice(5));
                //console.log(`"chanNavId: ${chanNavId}, "linkId: ${linkId}`)
                if (linkId == chanNavId) {
                    chanLink.classList.remove("invisible");
                    console.log("no longer invisible");
                }
                else {  
                    chanLink.classList.add("invisible");
                }
            }) 
        });
    });




    

    columns.forEach((column) => {
       column.addEventListener('click', () => {
               focus = column.firstChild.id;
               socket.emit('swap channel', focus);
               let chan_target = document.querySelector('#chan-span');
               chan_target.textContent = focus.slice(9)
               
               console.log(`focus: ${focus}`); 
               console.log("focus"); 
            });
        });
   


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
                target = target.toLowerCase();
                if (target == "home") {
                    //simply change focus and not reload new chan page
                   focus = `msg-room-home`;
                   //tell server to change current chan session to be home
                   socket.emit('home focus');
                   //change the session[channels] to home, but not the url
                }
                else {
                    console.log(`lowercase: ${target}`);
                    socket.emit('check', target)
                }
                    /*location = `http://127.0.0.1:5000/channels/${target}`*/
                msgBox.style.color = "#495057"
                msgBox.value = ""
                targeting = false
                
/*socket.emit('send create', {'chanName': chanName.value.toLowerCase()});*/

            }
         });

         



        /*saveChan.onclick = () => saveChannel();*/

        function chanNav(clicked) {
            //when corresponding nav button is clicked,
            //...make current channel links invisible
            //..and remove inivisble class from correct channels
            //const arr = clicked.classList;
            //console.log(arr[1]);


        } 
                     
        chanName.addEventListener('keydown', (e) => {
             if (e.key == "Enter") {
                saveChannel()   
             }
        });       
        
    });

    // When a new message is announced, append to DOM
    socket.on('broadcast message', message => {
        const li = document.createElement('li')
        li.classList.add("msgs");

        new_msg = `<span id="${message.id}"><span class="names">${message.name}:</span> ${message.message}</span>`
        li.innerHTML = new_msg

        document.querySelector(`#${focus}`).append(li);
    });

    socket.on('delete msg', id => {
        console.log(`id=${id}`)
        old_msg = document.getElementById(`${id}`).parentNode;
        /*old_msg.parentNode.removeChild(old_msg);*/
        old_msg.style.display = 'none';
        //maybe can change to .remove instead of display 'none'
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
        location = `http://127.0.0.1:5000/channels/${value}/none`
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
