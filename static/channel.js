

document.addEventListener('DOMContentLoaded', () => {
    //console.log("test")

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

    //console.log(`chachan ${chanChanNavBtnsCount}`);
    //console.log(privChanNavBtnsCount);

    

    let targeting = false;
    //console.log(location);

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

    //gets size of row-2 on load and resizes r2 according
    //... to height of fixed chat bar. Function called on
    //... resize too.
    let iH = 0;

    function getHeight(){   
        iH = window.innerHeight;
        r2 = document.querySelector(`#row-2`);
        r3 = document.querySelector(`#row-3`);
        msgW = document.querySelector(`#msg-window`);
        msgWH = document.querySelector(`#msg-window-home`);
        r3H = r3.offsetHeight;
        // Double the size of row 3 (.25 used to make it look nicer)
        deducter = r3H * 1.75;
        newHeight =  iH - deducter;
        //approx mobile width
        let curWidth = window.matchMedia( "(max-width: 768px)" );
        //console.log(`curWidth = ${window.innerWidth}`)
        // maths used to calcualte the size of the msg box
        ///... so that the size of widnows will change accordingly

        //If window is at the small/mobile width...
        if (curWidth.matches) {
            //two widnows now untop of each other instead of side to side...
            ///... hence the '/2'.
            newHeight /= 2;
            // below used to account for msg box
            let newHeightH = newHeight - r3H/2;
            //console.log("Changing according to m");
            msgW.style.height = `${newHeight}px`;
            msgWH.style.height = `${newHeightH}px`;
            //r2.style.height = `${newHeight}px`;

        }
        else {
            //console.log(newHeight)
            //console.log(r2.offsetHeight);

            //r2.style.height = `${newHeight}px`;
            msgW.style.height = `${newHeight}px`;
            msgWH.style.height = `${newHeight}px`;

            //console.log(r2.offsetHeight);
            //console.log("r2.offsetHeight");
        }

        

    }

    getHeight();

    

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
        //console.log(`showing only  ${chanNavId}`)
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
               //console.log("clicked")
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
                //console.log("Space Detected");
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
                    //console.log(`lowercase: ${target}`);
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
        //console.log(`id=${id}`)
        old_msg = document.getElementById(`${id}`).parentNode;
        /*old_msg.parentNode.removeChild(old_msg);*/
        old_msg.style.display = 'none';
        //maybe can change to .remove instead of display 'none'
    });

    // last step of save channel...
    // creates channel locally (previous steps created on server)
    socket.on('create channel', chanName => {
        //console.log("working");
        let appendHere = ""
        const li = document.createElement('li');
        /*li.className = "channel-links";*/
        jc = document.querySelector('#jinja_channels');
        pc = document.querySelector('#private_channels');
        if (chanName.private == true) {
            li.classList.add('priv-links', 'channel-links')
            li.id = `priv-link-${parseInt(finPrivLinkId)+1}`
            //console.log(`NEw id = ${finPrivLinkId}`);
            appendHere = pc;
            let tempId = parseFloat(li.id.slice(10));
            hideChannels("priv", Math.ceil(tempId / 10));

        }
        else {
            li.classList.add('chan-links', 'channel-links')
            li.id = `chan-link-${parseInt(finChanLinkId)+1}`
            //console.log(`NEw id = ${finChanLinkId}`)
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

// -- sidebars

    const ham1 = document.querySelector('#l-sidebar-toggle');
    const ham2 = document.querySelector('#r-sidebar-toggle');

    ham1.addEventListener("click", () => {
        sideBar("left")
        });

    ham2.addEventListener("click", () => {
        sideBar("right")
        });

    //if sidebar is opened and screensize is changed, hide sidebar when... 
    //media query when normally kick in
    var mq = window.matchMedia( "(min-width: 1200px)" );
 

    // classLists for sidebars
    const chan_title_div = document.querySelector('#chan-title-div');
    const ctd_list = chan_title_div.classList;
    const chan_name_div = document.querySelector('#chan-name-div');
    const cnd_list = chan_name_div.classList;
    const chan_selection = document.querySelector('#chan-selection');
    const cs_list = chan_selection.classList;
    const online_div = document.querySelector('#online-div');
    const od_list = online_div.classList;
    const online = document.querySelector('#online');
    const o_list = online.classList;
    //classes to be added so sidebars appear and dissapear
    const row1_classes = ["name-height", "col-md-6", "col-lg-5", "top"];
    const row2_classes = ["select-height", "col-sm-12","col-md-6", "col-lg-5", "top"];
    //left_sidebar
    const cnd_classes = row1_classes.concat(["sidebar", "form-width", "col-sm-10"])
    const cs_classes = row2_classes.concat(['sidebar'])
    //right_sidebar
    const od_classes = row1_classes.concat(["r_sidebar", "col-sm-12"])
    const o_classes = row2_classes.concat(["r_sidebar"])

    // toggle classes on and off
    function multi_class_toggle(ele_class_list, added_class_list, notClosing) {
        added_class_list.forEach(function(ele) {
            if (ele_class_list.contains(ele) == true) {
                console.log(`removing class: ${ele}`);
                ele_class_list.remove(ele);
            }
            else if (ele_class_list.contains(ele) == false && notClosing) {
                console.log(`adding class: ${ele}`);
                ele_class_list.add(ele);
            }
        });
    }

    //toggle the left sidebar on and off
    function leftSBar() {
        ham1.classList.toggle("alt_ham");
        multi_class_toggle(cnd_list, cnd_classes, notClosing);
        multi_class_toggle(cs_list, cs_classes, notClosing);
        multi_class_toggle(ctd_list, ["color-change"], notClosing);  
    }

    //toggle the right sidebar on and off
    function rightSBar() {
        multi_class_toggle(od_list, od_classes, notClosing);
        multi_class_toggle(o_list, o_classes, notClosing);    
    }

    // main function for sidebars
    function sideBar(side) {
        // if left hamburger is clicked
        if (side === "left") {
            notClosing = true;
            leftSBar();
        }
        // if right hamburger is clicked
        else if (side === "right") {
            notClosing = true;
            rightSBar();
        }
        // if resizing window
        else {
            notClosing = false;
            ham1.classList.add("alt_ham");
            leftSBar();
            rightSBar();
        }
    }

    //close sidebars on resize and resize scrollbars nicely
    function resize() {
        getHeight();
        //closeSideBars();
        sideBar("close")
    }

    window.onresize = resize;
});
