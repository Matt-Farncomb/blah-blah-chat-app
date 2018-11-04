
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


    function create_jina_form(chanName) {
        return `<button><a href="${chanName}">${chanName}</button>`;
          }
    // When connected...
    socket.on('connect', () => {
        
/*        saveName.onclick = () => {
                    
            console.log("called!!!");
            console.log("called!!!!!");
            usr_name = name.value;
            socket.emit('send name', {'name': name.value});

            name.disabled = true;
            name.hidden = true;
            saveName.disabled = true;
            saveName.hidden = true;
                /*return false;*/
       // };*/


         document.querySelector('#save-chan').onclick = () => {

            console.log("save chan test");
            
            socket.emit('send create', {'chanName': chanName.value.toLowerCase()});

            chanName.hidden = true;        
            saveChan.hidden = true;
            
        };
    });


     socket.on('create channel', chanName => {
        const button = document.createElement('button');
        const li = document.createElement('li');
        const sp = document.createElement('span')
        button.id = chanName;
        button.type = "submit";
        button.name = "clicked";
        button.value = chanName;
        button.innerText = chanName;

        new_form = create_jina_form(chanName);
        sp.innerHTML = new_form

        

        li.appendChild(sp)
        jc = document.querySelector('#jina_channels');
        jc.appendChild(li)
        /*jc.innerHTML = new_form*/
        console.log("creating");

        /*socket.emit('send store chan', {"channel":})*/

        /*li.appendChild(button)*/
;        /*li.innerHTML = `${name}: ${message}`*/
        /*channel.append(li);*/

        
 /*       jc.innerHTML = `<button id=${chanName} type="submit" name="clicked" value=${chanName}></button>`;
        new_button = document.querySelector('#'+chanName);
        new_button.innerText = chanName;

        li.appendChild(new_button);
        channel.append(li);*/
        //jl.appendChild(jc)
    });

    //other fucntions
    document.querySelector('#create').onclick = () => {

        saveChan.hidden = false;
        chanName.hidden = false;        
        

    /*    chanName.visibility = "visible";
        subName.visibility = "visible";*/

            
            //console.log("create");
            /*return false;*/
        };
});
