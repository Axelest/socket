module.exports = {
    signIn: (content_length, pragma, content, device_name) => 'HTTP/1.1 200 OK\r\n' +
        'Server: PeerConnectionTestServer/0.1\r\n' +
        'Cache-Control: no-cache\r\n' +
        'Connection: close\r\n' +
        'Content-Type: text/plain\r\n' +
        'Content-Length: ' + content_length + '\r\n' +
        'Pragma:' + pragma + '\r\n' +
        'Access-Control-Allow-Origin: *\r\n' +
        'Access-Control-Allow-Credentials: true\r\n' +
        'Access-Control-Allow-Methods: POST, GET, OPTIONS\r\n' +
        'Access-Control-Allow-Headers: Content-Type, Content-Length, Connection, Cache-Control\r\n' +
        'Access-Control-Expose-Headers: Content-Length, X-Peer-Id\r\n\r\n' + device_name + ',' + pragma + ',1\n',
    signOut: (content_length, pragma, content, device_name) => 'HTTP/1.1 200 OK\r\n' +
        'Server: PeerConnectionTestServer/0.1\r\n' +
        'Cache-Control: no-cache\r\n' +
        'Connection: close\r\n' +
        'Content-Type: text/plain\r\n' +
        'Content-Length: 0\r\n' +
        'Access-Control-Allow-Origin: *\r\n' +
        'Access-Control-Allow-Credentials: true\r\n' +
        'Access-Control-Allow-Methods: POST, GET, OPTIONS\r\n' +
        'Access-Control-Allow-Headers: Content-Type, Content-Length, Connection, Cache-Control\r\n' +
        'Access-Control-Expose-Headers: Content-Length, X-Peer-Id\r\n\r\n' + ' ,0\n',
    message: () => {}
}