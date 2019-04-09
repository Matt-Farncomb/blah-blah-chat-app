

document.addEventListener('DOMContentLoaded', () => {

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

    const row1 = document.querySelector(`#row-1`);
    const row2 = document.querySelector(`#row-2`);
    const row3 = document.querySelector(`#row-3`);

    const ol = document.querySelector('#online');

    const r1H = row1.offsetHeight;
    const r3H = row3.offsetHeight;

    //This is the private channel numbered nav bar
    const privBar = document.querySelector('.priv-bar');

    // classLists for sidebars
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
    //left sidebar classes
    const cnd_classes = row1_classes.concat(["sidebar", "form-width", "col-sm-10"])
    const cs_classes = row2_classes.concat(['sidebar'])
    //right sidebar classes
    const od_classes = row1_classes.concat(["r_sidebar", "col-sm-12"])
    const o_classes = row2_classes.concat(["r_sidebar"])

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

    let targeting = false;

    //Grabs current channel name from url
    curChanPath = location.pathname.split('/')
    curChan = curChanPath[2]
    let target = ""

    let usr_name = "unnamed"

    const columns = document.querySelectorAll('.chat-windows');
    let focused = false;
    let focus = `msg-room-${curChan}`;

    // used to find what nav number is currently selected
    let current_c_nav = {
        "priv":1,
        "chan":1
    }
 
    let iH = 0;

        function resizeBar(clicked, side) {

            const iH = window.innerHeight;
            const prvBarLoc = privBar.getBoundingClientRect();

            //resized to offset size of divs in window
            let newSize = iH - r1H;

            if (clicked) newSize -= r3H;

            if (side === "left") {
                if (newSize <= prvBarLoc.top) {
                    chan_selection.style.height = `${newSize}px` 
                    chan_selection.style.overflowY = "scroll";
                } else {
                    chan_selection.style.height = `${iH}px`; 
                    chan_selection.style.overflowY = "hidden";
                }
            } else {
                ol.style.height = `${newSize}px`;
            }
        }

    function calcHeight(offset) {
        const iH = window.innerHeight;
        const newHeight = r3H + offset;
        return iH - newHeight
}

    //get height of windows so scrollbars can be resized nicely
    function getHeight(){   
        const msgW = document.querySelector(`#msg-window`);
        const msgWH = document.querySelector(`#msg-window-home`);  
        let newHeight =  calcHeight(r1H)
        //approx mobile width
        let curWidth = window.matchMedia( "(max-width: 768px)" );
        // maths used to calcualte the size of the msg box
        ///... so that the size of widnows will change accordingly

        //If window is at the small/mobile width...
        if (curWidth.matches) {
            //two windows now untop of each other instead of side to side...
            ///... hence the '/2'.
            newHeight /= 2;
            msgW.style.height = `${newHeight}px`;
            // below used to account for msg box
            msgWH.style.height = `${newHeight-r3H/2}px`;
        }
        else {
            msgWH.style.height = `${newHeight}px`;
        }
        msgW.style.height = `${newHeight}px`;
    }

    getHeight();

    //getCurrentHeight()
    resizeBar(false, "left");
    //getCurrentHeight_online()
    resizeBar(false, "right");

    // Counts total channels. Used on browser load.
    function count_chans() {
        let temp = 0
        const chanLinks = document.querySelectorAll('.chan-links');

        chanLinks.forEach((chanLink) => {
            const finChanLinkId = chanLink.id;
            temp = parseInt(finChanLinkId.slice(10)) + 1;
        });
        //console.log(`temp: ${temp}`)    
        return temp
    }

    // Counts total private channels. Used on browser load.
    function count_privs() {
        let temp = 0
        const privLinks = document.querySelectorAll('.priv-links');

        privLinks.forEach((privLink) => {
            const finPrivLinkId = privLink.id;
            temp = parseInt(finPrivLinkId.slice(10)) + 1;
        });  
        return temp
    }

    // Will be incremeneted by one each time a channle is added to...
    //save having to run the whole fucntion multiple times
    let chan_count = count_chans();
    let priv_count = count_privs();


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
        const temp = chanName.value;
        if (temp.length < 1){
            alert("Please enter a valid name");
        }
        else if (temp.includes(" ")){
            alert("No spaces allowed");
        }
        else {
            socket.emit('send create', {
            'private':private,
            'chanName': chanName.value.toLowerCase()
            });
            chanName.value = ""
        }
        
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
    // Sets current Chan Nav too
    chanNavs.forEach((chanNav) => {
        chanNav.addEventListener('click', () => {
            const navType = chanNav.id.slice(4,8);
            const chanNavId = parseFloat(chanNav.id.slice(9));
            current_c_nav[navType] = chanNavId     
            hideChannels(navType, chanNavId);
        });
    });

    // hides the channel nav buttons so only a column of 5 appear at once
    function hideChannels(chanType, chanNavId) {
        const chanLinks = document.querySelectorAll(`.${chanType}-links`);
        chanLinks.forEach((chanLink) => {
            let linkId = parseFloat(chanLink.id.slice(10));

            linkId = Math.ceil((linkId+1) / 10) 
            console.log(`chanNavId: ${chanNavId} linkId: ${linkId}`)
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
            else if (e.code === "Space" && targeting === true) {;
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
                    socket.emit('check', target)
                }
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
        old_msg = document.getElementById(`${id}`).parentNode;
        old_msg.style.display = 'none';
        //maybe can change to .remove instead of display 'none'
    });

    // last step of save channel...
    // creates channel locally (previous steps created on server)
    socket.on('create channel', chanName => {
        let appendHere = ""
        const li = document.createElement('li');
        let c_type = "priv"
        jc = document.querySelector('#jinja_channels');
        pc = document.querySelector('#private_channels');
        if (chanName.private == true) {
            li.classList.add('priv-links', 'channel-links')
            li.id = `priv-link-${priv_count}`
            priv_count++;
            const mod = priv_count % 10
            console.log(`mod = ${mod}`)
            if (mod >= 5 ) {
                priv_count+=(10-mod)
            }
            appendHere = pc;
            let tempId = parseFloat(li.id.slice(10));

        }
        else {
            c_type = "chan"
            li.classList.add('chan-links', 'channel-links')
            li.id = `chan-link-${chan_count}`
            chan_count++;
            const mod = chan_count % 10
            console.log(`mod = ${mod}`)
            if (mod >= 5 ) {
                chan_count+=(10-mod)
            }

            appendHere = jc;
            let tempId = parseFloat(li.id.slice(10));
        }
        li.innerHTML = `<a href="/channels/${chanName["name"]}" class="nav-link">${chanName["name"]}</a>`
        appendHere.appendChild(li)
        hideChannels(c_type, current_c_nav[c_type]);   
    });

    socket.on('swap channel', value => {
        location = `http://127.0.0.1:5000/channels/${value}`
    })

    // updates 'online' div with the users and their channels
    socket.on('update users', value => {
        userChan = document.querySelector(`#cur-chan-${value.name}`)
        userChan.innerText = value.chan
    })

    // array to store who is online
    currently_online = []

    //tell server to reply who is online
    window.setInterval(function(){
        socket.emit("update online");
    }, 2000);
    

    // receive name of each user who is online... 
    socket.on('append online', value => {
        // and append to array
        currently_online.push(value);
    })

    // wipe array ever X seconds so old users won't remain logged on
    window.setInterval(function(){
        let onlineNames = document.querySelectorAll('.user-status');
        onlineNames.forEach((onlineName) => {
            const nameId = onlineName.id;
            const name = nameId.slice(9)
            console.log(`currently_online is ${currently_online}`)
            if (!currently_online.includes(name)) {
                onlineName.innerHTML = "offline"
            }
            else {
                onlineName.innerHTML = "online"
            }
        });
        currently_online = []
    }, 4000);

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
    let lSideBar = false;
    let rSideBar = false;

    //Opens up sidebars. If on sml screen size, close opposite sbar.
    ham1.addEventListener("click", () => {
        masterSB("left", "right");
        });

    ham2.addEventListener("click", () => {
        masterSB("right", "left");    
        });

    //if sidebar is opened and screensize is changed, hide sidebar when... 
    //media query when normally kick in
    var mq = window.matchMedia( "(min-width: 1200px)" );

    // sidebar object to store if left or right bar is open/closed
    // true if open
    const sBarObj = {
        "left":false,
        "right":false
     }


    // toggle classes on and off
    function multi_class_toggle(ele_class_list, added_class_list, notResizing, side) {
        removed = []
        added_class_list.forEach(function(ele) {
            if (ele_class_list.contains(ele) == true) {
                removed.push(ele)
                ele_class_list.add(`${side}_slideOut`)
                setTimeout(function () {
                        ele_class_list.remove(ele);
                }, 500); 
            }
            else if (ele_class_list.contains(ele) == false && notResizing) {
                ele_class_list.remove(`${side}_slideOut`)
                ele_class_list.add(ele);
            } 
        });
    }


function masterSB(side, oppSide) {
    let curWidth = window.matchMedia( "(max-width: 768px)" );
    notResizing = true;

    // open/close 'side' bar
    if (side === 'close') {
        notResizing = false;
        openSB("left")
        openSB("right")
        
    } else {
        openSB(side)
    }
    
    // if small width and both are now open, close oppSide
    if (curWidth.matches && notResizing && sBarObj[side] && sBarObj[oppSide]) {
        openSB(oppSide)
    }

}



function openSB(side) {

    if (side === "left") {

        if (ham1.classList.contains("alt_ham")){
            setTimeout(function() {
                ham1.classList.remove("alt_ham");
            }, 100);
        }
        else if (!ham1.classList.contains("alt_ham") && notResizing) {
            ham1.classList.add("alt_ham");
        }
        
        multi_class_toggle(cnd_list, cnd_classes, notResizing, "l");
        multi_class_toggle(cs_list, cs_classes, notResizing,"l");
        resizeBar(true, side);
        sBarObj["left"] = !sBarObj["left"]; 
    }

    else {
        multi_class_toggle(od_list, od_classes, notResizing, "r");
        multi_class_toggle(o_list, o_classes, notResizing, "r"); 
        resizeBar(true, side);
        sBarObj["right"] = !sBarObj["right"]; 
    }
}

    //close sidebars on resize and resize scrollbars nicely
    function resize() {
        getHeight();
        resizeBar(false, "left");
        resizeBar(false, "right");
        masterSB("close")
    }
    window.onresize = resize;


});
