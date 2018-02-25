// DEFINE DEPENDENCIES
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const https = require('https');
const url = require('url');
const net = require('net');
const sni = require('sni');
const mongoose = require('mongoose');
const headers = require('./libs/headers');

// DEFINE PORT
const port = process.env.PORT || '8888';

// DB Connection
//mongoose.connect('mongodb://localhost/tsunami');

// START EXPRESS
let app = express();
let pragma = 0;
let _contentLength = '';
let _membersNames = [];


app.use(bodyParser.json());
app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/assets'));
app.use(express.static(__dirname + '/frontend'));
app.set('port', port);



//  server.listen(port, () => console.log(new Date(), `Server is listening on port ${port}`));
let server = net.createServer((socket) => {
    //console.log(socket.remoteAddress);
    socket.on('data', (data) => {
        if (sni(data)) {
            console.log('looks like tls or https');
        } else if (/http\/1/i.test(data.toString())) {

            //console.log('looks like http ', data.toString());
            console.log('this is the data: ', data.toString());
            let str = data.toString().replace(/GET|POST|\/|HTTP\/1.0/gi, '');
            let _url = url.parse(str);

            let _memberDetail = { _isSignIn: false, _isSignOut: false, _name: '', _track_id: 0, _isAvailable: false };
            let _memberList = {};

            /// Handle HTTP request commnads
            switch (_url.pathname) {
                case 'sign_in':
                    pragma++;
                    _contentLength = '';

                    if (_membersNames.length > 0) {

                        _membersNames.forEach((value, index) => {
                            if (value._name === _url.query) {

                                value._isSignIn = true;
                                value._isSignOut = false;
                                value._track_id = pragma;
                            } else {

                                _memberDetail._isSignIn = true;
                                _memberDetail._name = _url.query;
                                _memberDetail._track_id = pragma;

                                _membersNames.push(_memberDetail);


                            }

                            _contentLength += value._name + "," + value._track_id + ",1\n";

                        });

                        //console.log('New connection....');
                        console.log(`New member added (total=${_membersNames.length}) : ${_url.query}`);
                        socket.write(SetHeader(_contentLength.length, pragma) + _contentLength);

                    } else {

                        _memberDetail._isSignIn = true;
                        _memberDetail._isAvailable = true;
                        _memberDetail._name = _url.query;
                        _memberDetail._track_id = pragma;

                        _membersNames.push(_memberDetail);

                        _contentLength = _url.query + "," + pragma + ",1\n";

                        console.log('New connection....');
                        console.log(`New member added (total=${_membersNames.length}) : ${_url.query}`);
                        socket.write(SetHeader(_contentLength.length, pragma) + _contentLength);
                    }

                    break;
                case 'wait':
                    _contentLength = '';
                    let _id = _url.query.toString().replace('peer_id=', '');
                    //console.log(' Peer id : ', _membersNames);

                    _membersNames.forEach((value, index) => {
                        if (value._track_id != _id && !value._isAvailable) {

                            value._isAvailable = true;

                            _contentLength = value._name + "," + value._track_id + ",1\n";

                            let update = 'HTTP/1.1 200 OK\r\n' +
                                'Server: PeerConnectionTestServer/0.1\r\n' +
                                'Cache-Control: no-cache\r\n' +
                                'Connection: close\r\n' +
                                'Content-Type: text/plain\r\n' +
                                'Content-Length: ' + _contentLength.length + '\r\n' +
                                'Pragma:' + value._track_id + '\r\n' +
                                'Access-Control-Allow-Origin: *\r\n' +
                                'Access-Control-Allow-Credentials: true\r\n' +
                                'Access-Control-Allow-Methods: POST, GET, OPTIONS\r\n' +
                                'Access-Control-Allow-Headers: Content-Type, Content-Length, Connection, Cache-Control\r\n' +
                                'Access-Control-Expose-Headers: Content-Length, X-Peer-Id\r\n\r\n';


                            socket.write(update + _contentLength);
                        } else {
                            socket.write('');
                        }



                    });

                    // if (  _membersNames[_id] ) {
                    //     let newUser = _membersNames[_id];
                    //     if( newUser.active || newUser._isSignIn ) return;

                    //     newUser.active = true;
                    //     console.log('Current user  : ', newUser, ' New user: ', newUser._name);
                    //     _contentLength = newUser._name  + "," + newUser._track_id + ",1\n";
                    //     socket.write(SetHeader(_contentLength.length, _id)+ _contentLength);
                    // }
                    console.log(`Total connected: ${_membersNames.length}\nNew connection....`);




                    break;
                case 'sign_out':
                    let peer_id = _url.query.toString().replace('peer_id=', '');
                    let _disconnectUser = '';
                    let _removingUser = '';

                    if (!_membersNames.length) return;

                    if ((peer_id - 1) > 0) {

                        let _postion = 0;
                        _membersNames.forEach((value, index) => {
                            if (value._track_id != peer_id) return;

                            _position = index;
                            _disconnectUser = value._name;

                            _contentLength = value._name + ',' + value._track_id + ",0\n";
                        });

                        socket.write(SetHeader(_contentLength.length, 0) + _contentLength);

                        _membersNames.splice(_postion, 1);
                    } else {
                        _removingUser = _membersNames[peer_id - 1];

                        _disconnectUser = _removingUser._name;

                        socket.write(SetHeader(0, '') + '');
                        _membersNames.splice(peer_id, 1);
                    }


                    console.log(`Member disconnected: ${_disconnectUser}`);

                    break;
                case 'message':
                    console.log('this is: ', decodeURIComponent(_url));
                    break;
                default:
                    break;
            }

            //socket.write('HTTP/1.1 200 OK\r\nContent-Type:text/plain \r\nContent-Length:27\r\n\r\n');

        } else {
            console.log('looks like tcp');
        }

    });

    socket.on('close', (close) => {
        console.log('Disconnecting socket..');
    });

    socket.on('error', (err) => {
        //console.log(err.message);
    });

    let SetHeader = (content, prag) => {

        if (content > 0) {

            return (
                '\r\nHTTP/1.1 200 Added \r\n' +
                'Server: PeerConnectionTestServer/0.1\r\n' +
                'Cache-Control: no-cache\r\n' +
                'Connection: close\r\n' +
                'Content-Type: text/plain\r\n' +
                'Content-Length: ' + content + '\r\n' +
                'Pragma: ' + prag + '\r\n' +
                'Access-Control-Allow-Origin: *\r\n' +
                'Access-Control-Allow-Credentials: true\r\n' +
                'Access-Control-Allow-Methods: POST, GET, OPTIONS\r\n' +
                'Access-Control-Allow-Headers: Content-Type, Content-Length, Connection, Cache-Control\r\n' +
                'Access-Control-Expose-Headers: Content-Length, X-Peer-Id\r\n\r\n'
            );
        } else {

            return (
                '\r\nHTTP/1.1 200 OK \r\n' +
                'Server: PeerConnectionTestServer/0.1\r\n' +
                'Cache-Control: no-cache\r\n' +
                'Connection: close\r\n' +
                'Content-Type: text/plain\r\n' +
                'Content-Length: ' + content + '\r\n' +
                'Access-Control-Allow-Origin: *\r\n' +
                'Access-Control-Allow-Credentials: true\r\n' +
                'Access-Control-Allow-Methods: POST, GET, OPTIONS\r\n' +
                'Access-Control-Allow-Headers: Content-Type, Content-Length, Connection, Cache-Control\r\n' +
                'Access-Control-Expose-Headers: Content-Length, X-Peer-Id\r\n\r\n'
            );
        }

    };

});

server.listen(port, () => console.log(new Date(), `Server is listening on port ${port}`));