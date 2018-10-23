/**
 *  @file	client.js
 *  @author	DotOut Inc. KKS
 *
 *  @class	tcpClient
 *  @classdesc	Micro Service 혹은 Distributor Server에 접속하기 위한 client 모듈
 *
 *  @member  {Object}	options	- Server의 ip와 port를 저장한 Object
 *    @property  {String}	host
 *    @property  {Integer}	port
 *
 *  @member  {Object}	client	- tcp통신을 위한 객체, 이벤트 핸들러가 등록되어있다.
 *    @event	  data	  - 데이터 패킷을 수신했을 때
 *    @evnet	  close	  - Connection이 close되었을 때 
 *    @event	  error	  - Connection상에 Error가 발생했을 때
 *
 *  @method	constructor
 *    @param  {String}	host	- 접속할 서버의 ip
 *    @param  {Integer}	port	- 접속할 서버의 port
 *    @param  {function}	onCreate
 *    @param  {function}	onRead	
 *    @param  {function}	onEnd
 *    @param  {function}	onError
 *    @description	- Server의 ip,port를 options에 등록
 *			- onCreate, onRead, onEnd, onError 함수를 등록
 *
 *  @method	onCreate
 *    @param  {Object}	options	- Server의 url과 port
 *    @description	- Server와 Connection 생성시 실행할 함수
 *
 *  @method	onClose
 *    @param  {Object}	options	- Server의 url과 port
 *    @description	- Server와 Connection Close 처리를 위한 함수
 *
 *  @method	onError
 *    @param  {Object}	options	- Server의 url과 port
 *    @parma  {Object}	errors	- 발생한 에러 객체
 *    @description	- Server와 Conncection에서 Error 처리를 위한 함수
 *
 *  @method	onRead
 *    @param  {Object}	options	  - Server의 url과 port
 *    @param  {Object}	data	  - 서버가 보낸 데이터 Object
 *    @description	- Server가 보낸 data를 처리하기 위한 함수
 *
 *  @method	connect	
 *    @param	No Param
 *    @description	- client Object를 생성하고 client에 이벤트 핸들러를 등록한다.
 *			- data 이벤트 발생시 패킷을 파싱하고 Object형태의 데이터로 환원한다.
 *			  1. 패킷을 구분자 '¶'로 파싱하여 message를 얻는다.
 *			  2. 이 때 merge가 존재하면 merge를 패킷 앞에 덧붙인다.
 *			  3. 마지막을 제외한 파싱된 message는 onRead함수에 넣어 실행시킨다.
 *			  4. 패킷의 마지막 byte가 구분자가 아닌 경우 merge에 마지막 message를 더한다.
 *			  5. 마지막 byte가 구분자면 마지막 message도 onRead함수에 넣어 실행시킨다.
 *
 *  @method	write
 *    @param  {Object}	  packet	- 서버로 전송할 내용
 *    @description	- 데이터를 JSON으로 인코딩하여 서버로 메세지를 전송한다.
 *
 */


const net = require('net')
class tcpClient {
	constructor(host, port, onCreate, onRead, onEnd, onError){
		this.options = {
			host: host,
			port: port
		}
		this.onCreate = onCreate
		this.onRead = onRead
		this.onEnd = onEnd
		this.onError = onError
	}

	//connection handling
	connect(){
		this.client = net.connect(this.options, () => {
			//Create connection successfully
			if(this.onCreate)
				this.onCreate(this.options)
		})

		//data event
		this.client.on('data', (data)=>{
			var sz = this.merge ? this.merge + data.toString() : data.toString()
			if( this.merge != null ) this.merge = null

			var arr = sz.split('¶')
			for( var n in arr) {
				if(sz.charAt(sz.length - 1) != '¶' && n == arr.length - 1){
					//message is over packet's size
					this.merge = arr[n]
					break
				} else if (arr[n] == ""){
					break
				} else{
					this.onRead(this.options, JSON.parse(arr[n]))
				}
			}
		})

		this.client.on('close', () => {
			if(this.onEnd)
				this.onEnd(this.options)
			})
		
		this.client.on('error', (err) => {
			if(this.onError)
				this.onError(this.options, err)
			})
		
	}
	write(packet){
		this.client.write(JSON.stringify(packet) + '¶')
	}
}
module.exports = tcpClient
