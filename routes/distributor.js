/**
 *  @file       distributor.js
 *  @author     DotOut Inc, KKS
 *  @see	해당 문서에서 Notify란 모든 유효한 Client에게 서버의 map 정보를 보냄을 의미한다.
 */

/**
 *  @namespace	{Object}	map
 *  @brief	등록된 Client들의 매핑 데이터
 *		"<url>:<host>" 를key로 한 Dictionary 구조이다. 
 *  @todo	mutex를 추가하여 동시에 map에 접근하는 것을 막아야할 수도 있음
 */
var map = {}


/**
 *  @class	distributor
 *  @classdesc	분산서버를 관리할 distributor서버의 클래스
 *  @extends	tcpServer
 *
 *  @method	constructor
 *    @param  {Object}	socket
 *    @description	- 부모 Constructor 호출
 *                            
 *  @method	onCreate	- Client  생성시 실행되는 함수 현재 map을 전송한다.
 *    @param  {Object}	socket
 *    @description	- 부모 Constructor 호출
 *
 *  @method	onClose
 *    @param  {Object}	socket
 *    @description	- Client와 Connection Close시 실행되는 함수
 *			  map에서 해당 정보를 삭제하고 Notify한다.
 *
 *  @method	onRead
 *    @param  {Object}	socket
 *    @param  {Object}	json	- 요청에 대한 정보를 담은 JSON객체
 *    @description	- data 메세지를 수신했을 때 실행할 함수
 *			- 현재까지는 새 distributor client의 등록 요청밖에 없음
 *			- Client 등록 요청시 map에 새 Client를 등록하고 Notify한다.
 *  
 *  @method	write
 *    @param  {Object}	socket
 *    @param  {Object}	packet	- 전송할 데이터 패킷
 *    @description	- client.js의 write와 동일. packet을 클라이언트에게 전송한다.
 *
 *  @method	sendInfo
 *    @param  {Object}	  socket	  - 요청을 보낸 Client의 socket Object
 *    @description	- 현재 map에 등록된 모든 Client 정보를 전송한다.
 *			- socket이 있으면 해당 socket으로 정보를 전송
 *			- socket이 없으면 모든 클라이언트들에게 정보를 전송
 *
 *  @see	client.js와 server.js를 읽고난 뒤에 읽는 편이 좋다.
 */
class distributor extends require('../models/tcpServer.js'){
	constructor() {
		super("distributor", 9000, ["POST/distributes", "GET/distributes"])
	}

	onCreate(socket) {
		console.log("onCreate", socket.remoteAddress, socket.remotePort)
		this.sendInfo(socket)
	}

	onClose(socket) {
		var key = socket.remoteAddress + ":" + socket.remotePort
		console.log("onClose", socket.remoteAddress, socket.remotePort)
		delete map[key]
		this.sendInfo()
	}


	onRead(socket, json) {
		var key = socket.remoteAddress + ":" + socket.remotePort
		console.log("onRead", socket.remoteAddress, socket.remotePort, json)

		if(json.uri == "/distributes" && json.method == "POST") {
			map[key] = {
				socket: socket
			}
			map[key].info = json.params
			map[key].info.host = socket.remoteAddress
			this.sendInfo()
		}
	}

	write(socket, packet) {
		socket.write(JSON.stringify(packet) + "¶")
	}

	sendInfo(socket) {
		var packet = {
			uri: "/distributes",
			method: "GET",
			key: 0,
			params: []
		}
		for (var n in map){
			packet.params.push(map[n].info)
		}
		if(socket){
			this.write(socket, packet)
		} else {
			for (var n in map){
				this.write(map[n].socket, packet)
			}
		}
	}
}

new distributor()
