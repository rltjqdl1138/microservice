/**
 *  @file	microservice_user.js
 *  @author	DotOut Inc, KKS
 *  @todo	임의의 default 값으로 포트번호는 9010을 사용하고 있음.
 *		임의의 Distributor 서버로 127.0.0.1:9000을 사용하고 있음.
 *		위 둘을 재설정 및 config파일로 뺄 것
 */
const business = require('../models/user.js')


/**
 *  @class	userMicroServer
 *  @classdesc	User DB를 관리하는 Micro Service 서버
 *  @extends	tcpServer.js
 *
 *  @method	constructor	
 *    @description	  - 부모 생성자를 호출하여 MicroService 서버를 실행
 *			  - distributor 서버에 접속 메세지를 보냄
 *
 *  @method	onRead
 *    @param  {object}	socket
 *    @param  {object}	data	- 수신한 정보를 담고있는 Object
 *    @description	  - data메세지를 수신했을 때 실행할 함수
 *			  - model의 onRequest를 실행하고 클라이언트로 메세지 전송
 *			  - callback에서 첫 param은 사용하지 않으나 통일성을 위해 유지
 *
 *
 */
class userMicroServer extends require('../models/tcpServer.js'){
	constructor() {
		console.log(process.argv)
		super("user"
		, process.argv[2] ? Number(process.argv[2]) : 9010
		, ["POST/user", "GET/user", "PUT/user", "DELETE/user"])
		
		this.connectToDistributor("127.0.0.1", 9000, (data)=>{
			console.log("Distributor Notification", data)
		})
	}
	onRead(socket, data) {
		console.log("onRead", socket.remoteAddress, socket.remotePort, data)
		business.onRequest(socket, data.method, data.uri, data.params, (s, packet) =>{
			socket.write(JSON.stringify(packet) + "¶")
		})
	}
}

new userMicroServer()
