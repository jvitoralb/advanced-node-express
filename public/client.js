$(document).ready(function () {
    /*global io*/
    const socket = io();

    socket.on('user', function(data) {
        console.log(data, 'data');
        $('#num-users').text(`${data.currentUsers} users online.`);
        let message = `${data.name}${(data.connected ? ' has joined the chat.' : ' has left the chat.')}`;
        $('#messages').append(
            $('<li>').html(`<b>${message}</b>`)
        );
    });

    // Form submittion with new message in field with id 'm'
    $('form').submit(function () {
        var messageToSend = $('#m').val();

        $('#m').val('');
        return false; // prevent form submit from refreshing page
    });
});
