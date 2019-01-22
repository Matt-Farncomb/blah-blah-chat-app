

document.addEventListener('DOMContentLoaded', () => {
    console.log("test")

    const channel = document.querySelector('#channels');
    const chanNames = document.querySelectorAll('.chan-name');
    const saveChan = document.querySelector('#save-chan');
    const msgBox = document.querySelector('#msg');
    const chanNavArrows = document.querySelectorAll('.nav-arrow');

    const channelLinks = document.querySelectorAll('.channel-links')
    const privLinks = document.querySelectorAll('.priv-links');
    const chanLinks = document.querySelectorAll('.chan-links');
    
    const chanChanNavBtns = document.querySelectorAll(`.chan-bar > .chan-nav-btn`);
    const privChanNavBtns = document.querySelectorAll(`.priv-bar > .chan-nav-btn`);

    // max amount of nav buttons for channel page switching
    const maxNavBtns = 3
    // used to find buttons on either side of nav
    const navShifter = maxNavBtns-1



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

    const columns = document.querySelectorAll('.chat-windows');
    let focused = false;
    let focus = `msg-room-${curChan}`;

    //for final int-id of below
    let finChanLinkId = ""
    let finPrivLinkId = ""

    //get final int-id of channel-links
    //right now this restarts when coutning privs. Must seperate them
    chanLinks.forEach((chanLink) => {
        finChanLinkId = chanLink.id;
        finChanLinkId = finChanLinkId.slice(10);
        //console.log(`finChanLinkId: ${finChanLinkId}`)
    });

     privLinks.forEach((privLink) => {
        finPrivLinkId = privLink.id;
        finPrivLinkId = finPrivLinkId.slice(10);
        //console.log(`finPrivLinkId: ${finPrivLinkId}`)
    });


    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    // Text grabbed from chat msg window and sent to server
    function sendMessage() {
        let msgText = msgBox.value
        // Don't allow an empty msg to send
        if (msgText.length > 0) {
            socket.emit('send message', {'message': msgText});
            msgBox.value = "";
        }
    }
   
    // Sends info to server to enable creation...
    // with channel named 'chanName' that's private or public
    function saveChannel(chanName, private) {
        socket.emit('send create', {
            'private':private,
            'chanName': chanName.value.toLowerCase()
            });
        chanName.value = ""
    }

    // Get id of the sibling two steps over in specified direction
    function nextSibId(ele, dir) {
        if (dir === "right") {
            return ele.previousSibling.previousSibling.id;
        }
        return ele.nextSibling.nextSibling.id;
    }

    //make element two steps over visible
    function revealSib(ele, dir) {
        if (dir === "right") {
            ele.nextSibling.nextSibling.classList.remove('invisible');
        }
        else {
            ele.previousSibling.previousSibling.classList.remove('invisible');
        }
    }

    // reveal next number along on nav, hiding alternate side
    function changeNavs(ele, direction) {
        // arrow clicked on (direction) determines which id is targeted
        const tempId = nextSibId(ele, direction)
        const tempEle = document.querySelector(`#${tempId}`);
        const tempList = tempEle.classList;

        if (tempList.contains('invisible')) {
            return changeNavs(tempEle, direction)
        }

        revealSib(tempEle, direction)
        return tempId;  
    }

    //click on left/right arrow minus/plus in chan page selection
    function next(new_id, direction) {
        if (direction.slice(5) === "left") {
            let left_parsed = changeNavs(new_id, "left");
            left_parsed_name = left_parsed.slice(0,9)
            //convert end of id to int and increment by navShifter so last btn is targeted
            left_parsed_int = parseInt(left_parsed.slice(9)) + navShifter;
            if (left_parsed_int > maxNavBtns) {
                //below must be changed to a MAX value
                left_parsed_str = `${left_parsed_name}${left_parsed_int}`;
                document.querySelector(`#${left_parsed_str}`).classList.add("invisible");
            }
        }
        else if (direction.slice(5) === "right") {
            let right_parsed = changeNavs(new_id, "right");
            right_parsed_name = right_parsed.slice(0,9)
            //convert end of id to int and increment by navShifter so last btn is targeted
            right_parsed_int = parseInt(right_parsed.slice(9)) - navShifter;
     
            if (right_parsed_name == "nav-chan-") {
                btnCount = chanChanNavBtnsCount - navShifter;
            }
            else {
                btnCount = privChanNavBtnsCount - navShifter
            }

            if (right_parsed_int < btnCount) {
                right_parsed_str = `${right_parsed_name}${right_parsed_int}`;
                document.querySelector(`#${right_parsed_str}`).classList.add("invisible");
            }
                        
        }
    }

    // arrow buttons will cycle through the channel page numbers
    chanNavArrows.forEach((chanNavBtn) => {
        chanNavBtn.addEventListener('click', () => {
            direction = chanNavBtn.id;
            next(chanNavBtn, direction);
        })
    })

    // save new channel and determine it private or not
    chanNames.forEach((chanName) => {
        let private = false;
        chanName.addEventListener('keydown', (e) => {
            if (e.key == "Enter") {
                if (chanName.id == "new_convo") {
                    private = true
                }
                saveChannel(chanName, private);
            }
        });
    });


    const chanNavs = document.querySelectorAll(".chan-nav-btn");

    // when cicking on chan page number, hide all channles not in that page...
    // and reveal the others
    chanNavs.forEach((chanNav) => {
        chanNav.addEventListener('click', () => {
            //let linkId = 1.0;
            const navType = chanNav.id.slice(4,8);
            const chanNavId = parseFloat(chanNav.id.slice(9));
            
            hideChannels(navType, chanNavId);
        });
    });

    // hides the channel nav buttons so only a column of 5 appear at once
    function hideChannels(chanType, chanNavId) {
        console.log(`showing only  ${chanNavId}`)
        const chanLinks = document.querySelectorAll(`.${chanType}-links`);
        chanLinks.forEach((chanLink) => {
            let linkId = parseFloat(chanLink.id.slice(10));
            linkId = Math.ceil(linkId / 10) 
            if (linkId == chanNavId) {
                chanLink.classList.remove("invisible");
            }
            else {  
                chanLink.classList.add("invisible");
            }
        }) 

    }

    // change which channel to post messages into on click
    columns.forEach((column) => {
       column.addEventListener('click', () => {
               focus = column.firstChild.id;
               socket.emit('swap channel', focus);
               let chan_target = document.querySelector('#chan-span');
               // change the text next that shows what channel user is posting to
               chan_target.textContent = focus.slice(9)
               console.log("clicked")
            });
        });
   
    // When connected...
    socket.on('connect', () => {
        // activate server's function to update client on who is logged on on which channel
        socket.emit('which channel');

         msgBox.addEventListener('keydown', (e) => {
            if (e.key == "Enter") {
                sendMessage()
                //stops enter making a line break
                e.preventDefault();
            }
        });

         // if user has pressed @ followed by space, switch channel
         msgBox.addEventListener('keydown', (e) => {
            if (e.key == "@") {
                msgBox.style.color = "blue";
                // prepare to switch channel
                targeting = true;
            }
            else if (e.code === "Space" && targeting === true) {
                console.log("Space Detected");
                temp = msgBox.value
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
                // stop preparing to switch channel
                targeting = false

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

    // last step of save channel...
    // creates channel locally (previous steps created on server)
    socket.on('create channel', chanName => {
        console.log("working");
        let appendHere = ""
        const li = document.createElement('li');
        /*li.className = "channel-links";*/
        jc = document.querySelector('#jinja_channels');
        pc = document.querySelector('#private_channels');
        if (chanName.private == true) {
            li.classList.add('priv-links', 'channel-links')
            li.id = `priv-link-${parseInt(finPrivLinkId)+1}`
            console.log(`NEw id = ${finPrivLinkId}`);
            appendHere = pc;
            let tempId = parseFloat(li.id.slice(10));
            hideChannels("priv", Math.ceil(tempId / 10));

        }
        else {
            li.classList.add('chan-links', 'channel-links')
            li.id = `chan-link-${parseInt(finChanLinkId)+1}`
            console.log(`NEw id = ${finChanLinkId}`)
            appendHere = jc;
            let tempId = parseFloat(li.id.slice(10));
            hideChannels("chan", Math.ceil(tempId / 10));
        }
        li.innerHTML = `<a href="/channels/${chanName["name"]}" class="nav-link">${chanName["name"]}</a>`
        appendHere.appendChild(li)
        //here here
        
        
    });

    socket.on('swap channel', value => {
        location = `http://127.0.0.1:5000/channels/${value}/none`
    })

    // updates 'online' div with the users and their channels
    socket.on('update users', value => {
        userChan = document.querySelector(`#cur-chan-${value.name}`)
        userChan.innerText = value.chan
    })

    updaters = document.querySelectorAll('.updater');

    // add new members to private channels
    updaters.forEach((updater) => {
        updater.addEventListener('keydown', (e) => {
            if (e.key == "Enter") {
                socket.emit("update private", {
                    "friend": updater.value,
                    "command":updater.id } )
                updater.value = ""; 
            }
        })
    })

    const ham1 = document.querySelector('#l-sidebar-toggle');
    const ham2 = document.querySelector('#r-sidebar-toggle');
    let leftSidebarActive = false;
    let rightSidebarActive = false;

    ham1.addEventListener("click", () => {
        if (leftSidebarActive == false) {;
            document.querySelector('#chan-name-div').classList.add("sidebar", "name-height", "col-sm-4","col-md-5", "col-lg-4", "shift-div" );
            document.querySelector('#chan-selection').classList.add("sidebar", "select-height",  "col-md-6", "col-lg-5");
            document.querySelector('#chan-name-div').classList.remove("col-sm-5");
            /*document.querySelector('#chan-name-div').style.left = "8.3%";*/

            ham1.style.zIndex = "2";
            ham1.style.position = "relative"
            leftSidebarActive = true;
            }
        else {
            document.querySelector('#chan-name-div').classList.remove("sidebar", "name-height", "col-md-6", "col-lg-5", "shift-div" );
            document.querySelector('#chan-selection').classList.remove("sidebar", "select-height", "col-md-6", "col-lg-5" );
            document.querySelector('#chan-name-div').classList.add("col-sm-5")
            leftSidebarActive = false;
        }
        });

    ham2.addEventListener("click", () => {
        if (rightSidebarActive == false) {
            console.log("clicked!!!");
            document.querySelector('#online-div').classList.add("r_sidebar", "name-height", "col-md-6", "col-lg-5" );
            document.querySelector('#online').classList.add("r_sidebar", "select-height",  "col-md-6", "col-lg-5");
            document.querySelector('#h-title-span').classList.add("invisible");
            ham2.style.zIndex = "2";
            ham2.style.position = "relative"
            rightSidebarActive = true;
            }
        else {
            document.querySelector('#online-div').classList.remove("r_sidebar", "name-height", "col-md-6", "col-lg-5" );
            document.querySelector('#online').classList.remove("r_sidebar", "select-height", "col-md-6", "col-lg-5" );
            document.querySelector('#h-title-span').classList.remove("invisible");
            rightSidebarActive = false;
        }
        });

    //if sidebar is opened and screensize is changed, hide sidebar when... 
    //media query when normally kick in
    var mq = window.matchMedia( "(min-width: 1200px)" );
    window.onresize = resize;

    function resize() {
        if (mq.matches && leftSidebarActive == true || rightSidebarActive == true) {
            console.log("removing classes");
            document.querySelector('#chan-name-div').classList.remove("sidebar", "name-height", "col-md-6", "col-lg-5", "shift-div" );
            document.querySelector('#chan-selection').classList.remove("sidebar", "select-height", "col-md-6", "col-lg-5" );
            document.querySelector('#online-div').classList.remove("r_sidebar", "name-height", "col-md-6", "col-lg-5" );
            document.querySelector('#online').classList.remove("r_sidebar", "select-height", "col-md-6", "col-lg-5" );
            document.querySelector('#h-title-span').classList.remove("invisible");
            leftSidebarActive = false;
            rightSidebarActive = false;
        }
    }

    
    

});
