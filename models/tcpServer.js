/**
 *  @file	server.js
 *  @author	DotOut Inc. KKS
 *
 *  @class	tcpServer
 *  @classdesc	Micro Service 또는 Distributor를 위한 TCP server 모듈 클래스
 *
 *  @member  {Object}	context	- 서버의 정보를 저장한다.
 *    @property  {Integer}	port	- 서버의 포트
 *    @property  {String}	name	- 서버의 기능별로 분류되는 이름
 *    @property  {Array}	urls	- 서버에 요청할 수 있는 최상위 url들의 리스트
 *
 *  @member  {Object}	server	- tcp서버의 객체 이벤트 핸들러가 등록되어있음
 *    @event	  error - server Object 자체의 error이벤트 처리. 
 *
 *  @member  {Object}	clientDistributor	- distributor에 대한 tcpClient 객체
 *
 *  @method	constructor
 *    @param  {Integer}	port	- Server의 포트
 *    @param  {String}	name	- Server의 기능으로 분류되는 이름
 *    @param  {Array}	urls	- Server에 요청할 수 있는 최상위 url들의 리스트
 *    @description	- Server의 ip, port, url을 context에 등록한다.
 *			- tcp Server를 생성하고 server Object에 등록한다.
 *			- Client와 Connection에 대한 이벤트 핸들러를 등록 (tcp Client와 동일구조)
 *			- server Object의 이벤트 핸들러 등록후 context의 정보로 listening 시작
 *
 *  @method	onCreate
 *    @param  {Object}	socket
 *    @description	- server Object 생성시 실행할 함수
 *
 *  @method	onClose
 *    @param  {Object}	socket
 *    @description	- Client와 연결을 끊고 실행하는 함수
 *			- 현재 별 다른 오류처리 없이 error메세지에도 이 함수 호출
 *
 *  @method	connectToDistributor
 *    @params	  {String}	  host	- distributor 서버의 host
 *    @params	  {Integer}	  port	- distributor 서버의 port
 *    @params	  {function}	  callback	- data 수신 이벤트에 대한 콜백함수
 *    @description	- Distributor로 접속을 시도 및 유지하는 함수
 *			- distributor와 연결이 끊겼을 경우 3초에 한번씩 계속 접속을 시도한다.
 *
 *  @see	- client.js와 유사한 부분이 많으므로 이에대한 내용은 생략
 *		- socket에 등록된 이벤트는 클라이언트와의 통신과 관련된 이벤트 핸들러이다.
 *		- server객체 자체에 등록된 이벤트는 server객체 자체의 이벤트 핸들러이다.
 *
 *  @todo	- error에 대한 기준 마련, error 처리를 위한 onError Method 짜기
 */

const net = require('net')
const tcpClient = require('./tcpClient')

class tcpServer {
	constructor(name, port, urls) {
		this.context = {
			port: port,
			name: name,
			urls: urls
		}
		this.merge = {}

		this.server = net.createServer((socket) => {
			//Client connect event
			this.onCreate(socket)

			//Error event 핸들러 등록
			socket.on('error', (exception) => {
				this.onClose(socket)
			})
			//Close event 핸들러 등록
			socket.on('close',() => {
				this.onClose(socket)
			})
			//Data event 핸들러 등록
			socket.on('data', (data) => {
				var key = socket.remoteAddress + ':' + socket.remotePort
				var sz = this.merge[key] ? this.merge[key] + data.toString() :
						data.toString()
				console.log(sz)
				var arr = sz.split('¶')
				for (var n in arr) {
					if (sz.charAt(sz.length-1)!='¶' && n==arr.length-1){
						this.merge[key] = arr[n]
						break
					} else if(arr[n] == "") {
						break
					} else{
						this.onRead(socket, JSON.parse(arr[n]))
					}
				}
			})
		})	
		
		//Server Object's error
		this.server.on('error', (err)=>{
			console.log(err)
		})

		//Start Listening
		this.server.listen(port, () => {
			console.log('listen', this.server.address())
		})
	}
	
	//Create Connection Successfully
	onCreate(socket) {
		console.log("onCreate", socket.remoteAddress, socket.remotePort)
	}

	//Close Connection Successfully
	onClose(socket) {
		console.log("onClose", socket.remoteAddress, socket.remotePort)
	}


	//Distributor connect function
	connectToDistributor(host, port, callback) {
		var packet = {
			uri: "/distributes",
			method: "POST",
			key: 0,
			params: this.context	
		}
		var isConnectedDistributor = false
		this.clientDistributor = new tcpClient(
			host
			, port
			//Connect Event
			, (options) => {
				isConnectedDistributor = true
				this.clientDistributor.write(packet)
			}

			//Data Event
			, (options, data) => { callback(data) }

			//Connection close Event
			, (options) => { isConnectedDistributor = false }

			//Error Event
			, (options) => { isConnectedDistributor = false }
		)

		setInterval( () => {
			if (isConnectedDistributor != true){
				this.clientDistributor.connect()
			}
		}, 3000)
	}
}

module.exports = tcpServer
