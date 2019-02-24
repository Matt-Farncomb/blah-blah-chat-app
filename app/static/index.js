
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
        return `<button><a href="/channels/${chanName}">${chanName}</button>`; }
          
    // When connected...
    socket.on('connect', () => {

         document.querySelector('#save-chan').onclick = () => {

            console.log("save chan test");
            
            socket.emit('send create', {'chanName': chanName.value.toLowerCase()});

            chanName.hidden = true;        
            saveChan.hidden = true;          
        };
    });


     socket.on('create channel', chanName => {
        const sp = document.createElement('span')
        jc = document.querySelector('#jinja_channels');
        sp.innerHTML = `<li><button>
                            <a href="/channels/${chanName}">${chanName}
                        </button></li>`;
        jc.appendChild(sp)

    });

    //other fucntions
    document.querySelector('#create').onclick = () => {

        saveChan.hidden = false;
        chanName.hidden = false;        
        
        };
});
