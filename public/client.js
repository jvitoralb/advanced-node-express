$(document).ready(function () {
    /*global io*/
    const socket = io();

    socket.on('user', function(data) {
        $('#num-users').text(`${data.currentUsers} users online`);
        let message = `${data.name}${(data.connected ? ' has joined the chat.' : ' has left the chat.')}`;
        $('#messages').append(
            $('<li>').html(`<b>${message}</b>`)
        );
    });
    // socket.on('user', data => {
    //     $('#num-users').text(data.currentUsers + ' users online');
    //     let message = data.name + (data.connected ? ' has joined the chat.' : ' has left the chat.');
    //     $('#messages').append($('<li>').html('<b>' + message + '</b>'));
    // });

    socket.on('chat message', function(data) {
        $('#messages').append(
            $('<li>').text(`${data.message}, ${data.name}`)
        );
    });

    // Form submittion with new message in field with id 'm'
    $('form').submit(function () {
        let messageToSend = $('#m').val();
        socket.emit('chat message', messageToSend);
        $('#m').val('');
        return false; // prevent form submit from refreshing page
    });
});
