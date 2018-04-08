var socket = io.connect("http://" + document.domain + ":" + location.port);

//When connecting, the client should request the current command history, undo history, and redo history
//To get in sync
socket.on('connect', function() { socket.emit('Connection event', {data: 'connected'});}); 


function sendShape(data){
    socket.emit('addShapeRequest', data);
}
 
socket.on('addShapeEvent', function(data) {
    command = DataManager.unpackage(data);
    c.shape_manager.execute_command(command);
});