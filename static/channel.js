
//NOTES: Won't regeister a change unless actual new code is added ratehr than just ccommenting out some stuff

document.addEventListener('DOMContentLoaded', () => {
    console.log("test")

  /*  const saveName = document.querySelector('#save-name');*/
    const channel = document.querySelector('#channels');
    const chanNames = document.querySelectorAll('.chan-name');
    const saveChan = document.querySelector('#save-chan');
    const msgBox = document.querySelector('#msg');
    const chanNavArrows = document.querySelectorAll('.nav-arrow');
    
    const chanChanNavBtns = document.querySelectorAll(`.chan-bar > .chan-nav-btn`);
    const privChanNavBtns = document.querySelectorAll(`.priv-bar > .chan-nav-btn`);


    /*const name = document.querySelector('#input-name');*/

    let privChanNavBtnsCount = 0;
    privChanNavBtns.forEach((privChanNavBtn) => {
        privChanNavBtnsCount += 1;
    });

    let chanChanNavBtnsCount = 0;
    chanChanNavBtns.forEach((chanChanNavBtn) => {
        chanChanNavBtnsCount += 1;
    });

    console.log(`chachan ${chanChanNavBtnsCount}`);
    console.log(privChanNavBtnsCount);

    

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
            c
            msgBox.value = "";
            console.log("is doing something");
        }
    }

    function saveChannel(chanName, private) {

        socket.emit('send create', {
            'private':private,
            'chanName': chanName.value.toLowerCase()
            });
        

        chanName.value = ""
       /* chanName.hidden = true;        
        saveChan.hidden = true;*/
    }

    /*function saveRoom(newRoom) {
        socket.emit('send create', {'chanName': newRoom.value.toLowerCase()});
        newRoom.value = ""
    }*/

    function changeNav(ele){
        let tempId = ele.previousSibling.previousSibling.id;
        let classListed = document.querySelector(`#${tempId}`);
        newClassList = classListed.classList;
        if (newClassList.contains('invisible')) {
            return changeNav(classListed);
        }
        else {
            classListed.nextSibling.nextSibling.classList.remove('invisible');
            /*parsed = tempId.slice(4)*/
            console.log(`tempid: ${tempId}`)
            return tempId;
        }
    }

    function changeNavPrev(ele){
        console.log(`ele: ${ele.id}`)
        let tempId = ele.nextSibling.nextSibling.id;
        let classListed = document.querySelector(`#${tempId}`);
        newClassList = classListed.classList;
        if (newClassList.contains('invisible')) {;
            return changeNavPrev(classListed);
        }
        else {
            classListed.previousSibling.previousSibling.classList.remove('invisible');
/*            parsed = tempId.slice(4)
            console.log(`func parsed: ${parsed}`)*/
            console.log(`tempid: ${tempId}`)
            return tempId;
        }
    }

    function next(new_id, direction) {
        //click on left/right arrow minus/plus in chan page selection
        if (direction.slice(5) === "left") {
            let left_parsed = changeNavPrev(new_id);
            left_parsed_name = left_parsed.slice(0,9)

            console.log(`left_parsed!!!: ${left_parsed.slice(0,9)}`);

            //convert end of id to int and increment by 3 so last btn is targeted
            left_parsed_int = parseInt(left_parsed.slice(9)) + 3;
            console.log(`int: ${left_parsed_int}`)
            if (left_parsed_int > 4) {
                console.log(`int: ${left_parsed_int}`)
                
                
                //below must be changed to a MAX value
                left_parsed_str = `${left_parsed_name}${left_parsed_int}`;
                console.log(left_parsed_str)
                document.querySelector(`#${left_parsed_str}`).classList.add("invisible");
            }
        }
        else if (direction.slice(5) === "right") {
            console.log(`direction: ${direction}`);
            let right_parsed = changeNav(new_id);
            right_parsed_name = right_parsed.slice(0,9)
            console.log(`right_parsed_name: ${right_parsed_name}`);
            console.log(`right_parsed!!!: ${right_parsed.slice(0,9)}`);
            
            //convert end of id to int and increment by 3 so last btn is targeted
            right_parsed_int = parseInt(right_parsed.slice(9)) - 3;
            console.log(`int: ${right_parsed_int}`)
            //half of max number
            if (right_parsed_name == "nav-chan-") {
                btnCount = chanChanNavBtnsCount-3;
            }
            else {
                btnCount = privChanNavBtnsCount-3
            }

            if (right_parsed_int < btnCount) {
                console.log(`int: ${right_parsed_int}`)
                
                
                //below must be changed to a MAX value
                right_parsed_str = `${right_parsed_name}${right_parsed_int}`;
                console.log(right_parsed_str)
                document.querySelector(`#${right_parsed_str}`).classList.add("invisible");
            }
                        
        }
    }

    chanNavArrows.forEach((chanNavBtn) => {
        chanNavBtn.addEventListener('click', () => {
            direction = chanNavBtn.id;
            next(chanNavBtn, direction);
        })
    })

    chanNames.forEach((chanName) => {
        let private = false;
        chanName.addEventListener('keydown', (e) => {
            if (e.key == "Enter") {
                console.log("Consoling and maybe working");
                if (chanName.id == "new_convo") {
                    private = true
                }
                saveChannel(chanName, private);
            }
        });
    });


   /* chanName.addEventListener('keydown', (e) => {
             if (e.key == "Enter") {
                saveChannel()   
             }
        });  */



    const chanNavs = document.querySelectorAll(".chan-nav-btn");
    console.log("ha");


    chanNavs.forEach((chanNav) => {
        chanNav.addEventListener('click', () => {
            let linkId = 1.0;
            console.log("this one");
            const navType = chanNav.id.slice(4,8);
            console.log(navType);
            const chanNavId = parseFloat(chanNav.id.slice(9));
            //`link-${temp}`
            const chanLinks = document.querySelectorAll(`.${navType}-links`);
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
                     
/*        chanNames.addEventListener('keydown', (e) => {
             if (e.key == "Enter") {
                saveChannel()   
             }
        });       
        */
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
        let appendHere = ""
        const sp = document.createElement('span')
        jc = document.querySelector('#jinja_channels');
        pc = document.querySelector('#private_channels');
        if (chanName.private == true) {
            appendHere = pc
            console.log(`private: ${chanName.private}`)
        }
        else {
            appendHere = jc
            console.log(`not private: ${chanName.private}`)
        }
        sp.innerHTML = `<li class="channel-links">
                            <a href="/channels/${chanName["name"]}" class="nav-link">${chanName["name"]}
                        </li>`;
        appendHere.appendChild(sp)

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

    socket.on('test msg', data => {
        console.log(data);
        console.log("test success");
    })

    //const invite = document.querySelector('#invite');

    updaters = document.querySelectorAll('.updater');


    updaters.forEach((updater) => {
        updater.addEventListener('keydown', (e) => {
            if (e.key == "Enter") {
                console.log("updater working");
                socket.emit("update private", {
                    "friend": updater.value,
                    "command":updater.id } ) 
            }
        })
    })
    




});
