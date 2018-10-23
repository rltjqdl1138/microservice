/**
 *  @file	user.js
 *  @brief	User DB에 접근하기 위한 함수들
 *  @author	DotOut Inc, KKS
 *  @see	process.nextTick은 비동기 작업을 위한 함수 
 *		프로세스의 자체 스케줄링에 따라 충분히 늦게 callback을 실행시킬 수 있다.
 *  @todo	Growth Hacking을 고려하여 DB확장하기
 */

const config = require('../config')
const crypto = require('crypto')
const Orientdb = require('orientjs')
const server = Orientdb(config.dbServerConfig)

/**
 *  @function	onRequest
 *  @param	{Object}	res	- GateWay의 요청에 대한 response 객체
 *  @param	{String}	method	- http요청의 method ( GET, POST, PUT, DELETE )
 *  @param	{Array}		path	- http요청의 url을 /로 파싱한 Array
 *  @param	{Object}	params	- http요청의 body에 해당하는 내용
 *  @param	{function}	callback- 이 함수에 대한 callback 함수
 *
 *  @return	{function}	클라이언트의 Request를 처리하는 함수
 *
 *  @description	- 요청 method와 URL을 보고 Request를 처리하는 함수를 리턴한다.
 */
exports.onRequest = ( res, method, path, params, callback ) => {
	switch (method){
		case "POST":
			return register(method, path, params, (response) => {
				process.nextTick(callback, res, response) })
		case "PUT":
			return edit(method, path, params, (response) => {
				process.nextTick(callback, res, response) })
		case "DELETE":
			return unregister(method, path, params, (response) => {
				process.nextTick(callback, res, response) })
		case "GET":
			return inquery(method, path, params, (response) => {
				process.nextTick(callback, res, response) })
		default:
			return process.nextTick(callback, res, null)
	}
}


/**
 *  @function	runQuery
 *  @brief	- 완성된 SQL query를 실행하는 함수
 *
 *  @param      {Object}        response- http응답을 위한 패킷객체
 *    @property	  {Integer}	  errorcode	- 에러코드
 *    @property	  {String}	  errormessage	- 에러에대한 자세한 메세지
 *    @property	  {Object}	  result	- 클라이언트에게 보내줄 결과
 *
 *  @param	{String}	query	- 실행시킬 query
 *  @param      {function}      callback- 이 함수에 대한 callback 함수
 *
 *  @return	No Return
 *
 *  @description	- 각각의 함수에서 db에 연결시 오류 처리가 어려워 통일된 함수에서 실행
 *			- query실행에 실패시 errorcode와 errormessage를 변경 후 callback 실행
 *			- query실행에 성공시 result를 response에 추가하고 callback 실행
 *
 *  @todo	errorcode를 우선 1로 설정해둠 추후에 적절한 숫자로 변경해야함
 */
function runQuery( response, query, callback ){
	var db = server.use(config.UserDBConfig)
	db.open()
	db.query(query)
	.then( (results)=>{
		db.close(); server.close() 
		response.result = results
		callback(response) })
	.catch( (error)=>{
		console.log(error)
		response.errorcode = 1
		response.errormessage = error.message
		db.close(); server.close();
		callback(response) })
}


/**
 *  @function	inquery
 *  @param      {String}        method	- http요청의 method ( GET, POST, PUT, DELETE )
 *  @param      {Array}         pathname- http요청의 url을 /로 파싱한 Array
 *  @param      {Object}        params	- http요청의 url쿼리 파라미터에 해당하는 내용
 *					- 현재는 사용하지 않으나 통일성 및 확장성을 위해 유지
 *  @param      {function}      callback- 이 함수에 대한 callback 함수
 *
 *  @description	- /user URL로 들어온 GET Request를 처리하는 함수
 *			- 함수의 실행 프로세스는 따로 공유 Doc에 작성하고 간단한 주석만 중간에 삽입
 *  @todo	- url 쿼리로 옵션만들어 통해 좀 더 디테일한 데이터 요청을 가능하게 해야함
 *
 */

function inquery(method, pathname, params, callback) {
	var response =  {
		key: params.key,
		errorcode: 0,
		errormessage: "success",
	}
	var query = ""

	if( pathname.length == 1 ){
		//All Users' information
		query = "SELECT * from User"
		runQuery(response, query, callback )
	}
	else if( pathname[1] == 'userid' ){
		if(pathname.length == 2){
			//All Users' id
			query = "SELECT userId from User"
			runQuery(response, query, callback )
		} else if (pathname.length == 3){
			//pathname[2]'s info
			query = "SELECT * from User WHERE userId='"+pathname[2]+"'"
			runQuery(response, query, callback )
		} else if ( pathname.length == 4){
			if(pathname[3]=='password'){
				//pathname[2]'s password
				query = "SELECT password from User WHERE userId='"+pathname[2]+"'"
				runQuery(response, query, callback )
			}
			else if(pathname[3]=='nickname'){
				//pathname[2]'s nickname
				query = "SELECT nickname from User WHERE userId='"+pathname[2]+"'"
				runQuery(response, query, callback )
			}
			else{
				//pathname[2]'s other information
				response.errorcode = 1
				response.errormessage = "worng pathname"
				callback( response )
			}
		} else{
		//length is over 5
			response.errorcode = 1
			response.errormessage = "worng pathname"
			callback( response )
		}
	}
	else if (pathname[1] == 'nickname' ){
		if(pathname.length == 2){
			//All Users' nickname
			query = "SELECT nickname from User"
			runQuery(response, query, callback )
		//All Users' nickname
		} else if (pathname.length == 3){
			//pathname[2]'s info
			query = "SELECT * from User WHERE nickname='"+pathname[2]+"'"
			runQuery(response, query, callback )
		} else if ( pathname.length == 4){
			if(pathname[3]=='password'){
				//pathname[2]'s password
				query = "SELECT password from User WHERE nickname='"+pathname[2]+"'"
				runQuery(response, query, callback )
			}
			else if(pathname[3]=='userid'){
				//pathname[2]'s nickname
				query = "SELECT userId from User WHERE nickname='"+pathname[2]+"'"
				runQuery(response, query, callback )
			}
			else{
				//pathname[2]'s other information
				response.errorcode = 1
				response.errormessage = "worng pathname"
				callback( response )
			}
		} else{
			//length is over 5
			response.errorcode = 1
			response.errormessage = "worng pathname"
			callback( response )
		}
	} else{
		response.errorcode = 1
		response.errormessage = "worng pathname"
		callback( response )
	}
	
}


/**
 *  @function	register
 *  @param      {String}        method	- http요청의 method ( GET, POST, PUT, DELETE )
 *  @param      {Array}         pathname- http요청의 url을 /로 파싱한 Array
 *  @param      {Object}        params	- http요청의 body에 해당하는 내용
 *    @property	  {String}	  userId
 *    @property	  {String}	  password
 *    @property	  {String}	  nickname
 *  @param      {function}      callback- 이 함수에 대한 callback 함수
 *
 *  @description	- 유저정보를 CREATE 하는 쿼리를 생성하는 함수
 *			  함수의 실행 프로세스는 따로 공유 Doc에 작성하고 간단한 주석만 중간에 삽입
 *
 *  @see	- password는 crypto를 이용하여 base64인코딩 -> sha1암호화 과정을 통해 암호화됨
 */
function register(method, pathname, params, callback) {
	var response =  {
		key: params.key,
		errorcode: 0,
		errormessage: "success"
	}
	if ( pathname.length != 1 ){
		response.errorcode = 1
		response.errormessage = "worng pathname"
		callback( response )
	}
	if ( params.userId == null || params.password == null || params.nickname == null){
		response.errorcode = 1
		response.errormessage = "Invalid Parameters"
		callback(response)
	} else {
		params.password = crypto.createHmac('sha1', config.secret)
					.update(params.password)
					.digest('base64')
		
		var query = "CREATE VERTEX User SET " +
				"userId='"	+ params.userId +
				"', password='"	+ params.password +
				"', nickname='"	+ params.nickname +
				"'"
		runQuery(response, query, callback )
	}
}


/**
 *  @function	edit
 *  @param      {String}        method	- http요청의 method ( GET, POST, PUT, DELETE )
 *  @param      {Array}         pathname- http요청의 url을 /로 파싱한 Array
 *  @param      {Object}        params	- http요청의 body에 해당하는 내용
 *    @property	  {String}	  userId
 *    @property	  {String}	  password
 *    @property	  {String}	  nickname
 *
 *  @param      {function}      callback- 이 함수에 대한 callback 함수
 *
 *  @description	- 유저정보를 UPDATE 하는 쿼리를 생성하는 함수
 *			  함수의 실행 프로세스는 따로 공유 Doc에 작성하고 간단한 주석만 중간에 삽입
 *
 *  @see	- password는 crypto를 이용하여 base64인코딩 -> sha1암호화 과정을 통해 암호화됨
 *
 */
function edit( method, pathname, params, callback ) {
	var response =  {
		key: params.key,
		errorcode: 0,
		errormessage: "success"
	}
	if(params != null && params.password != null){
		params.password = crypto.createHmac('sha1', config.secret)
				.update(params.password)
				.digest('base64')
	}
	var query = ""
	if( pathname.length == 1 ){
		response.errorcode = 1
		response.errormessage = "Invalid URL"
		callback(response)
	} else if( pathname[1] == 'userid' ){
		if(pathname.length == 3){
			//check
			if( params.nickname == null ||
				params.password == null ){
				response.errorcode = 1
				response.errormessage = "Invalid Parameters"
				callback(response)
			}else{
				query = "UPDATE User SET " +
					"nickname='"	+ params.nickname + "'" +
					"password='"	+ params.password + "'" +
					"WHERE userId='" + pathname[2] + "'"
				runQuery(response, query, callback )
			}
		}else if( pathname.length == 4){
			if(pathname[3] == 'nickname'){
				query = "UPDATE User SET " +
					"nickname='"	+ params.nickname + "'" +
					"WHERE userId='" + pathname[2] + "'"
				runQuery(response, query, callback )
			} else if( pathname[3] == 'password' ){
				query = "UPDATE User SET " +
					"password='"	+ params.password + "'" +
					"WHERE userId='" + pathname[2] + "'"
				runQuery(response, query, callback )
			} else{
				response.errorcode = 1
				response.errormessage = "Invalid URL"
				callback(response)
			} 
			
		} else{
			response.errorcode = 1
			response.errormessage = "Invalid URL"
			callback(response)
		}
	} else if( pathname[1] == 'nickname' ){
		if(pathname.length == 3){
			//check
			if( params.nickname == null ||
				params.password == null ){
				response.errorcode = 1
				response.errormessage = "Invalid Parameters"
				callback(response)
			}else{
				query = "UPDATE User SET " +
					"nickname='"	+ params.nickname + "'" +
					"password='"	+ params.password + "'" +
					"WHERE nickname='" + pathname[2] + "'"
				runQuery(response, query, callback )
			}
		}else if( pathname.length == 4){
			if(pathname[3] == 'nickname'){
				query = "UPDATE User SET " +
					"nickname='"	+ params.nickname + "'" +
					"WHERE nickname='" + pathname[2] + "'"
				runQuery(response, query, callback )
			} else if( pathname[3] == 'password' ){
				query = "UPDATE User SET " +
					"nickname='"	+ params.nickname + "'" +
					"WHERE nickname='" + pathname[2] + "'"
				runQuery(response, query, callback )
			} else{
				response.errorcode = 1
				response.errormessage = "Invalid URL"
				callback(response)
			}
		}else{
			response.errorcode = 1
			response.errormessage = "Invalid URL"
			callback(response)

		}
	} else{
		response.errorcode = 1
		response.errormessage = "Invalid URL"
		callback(response)
	}
}

/**
 *  @function	unregister
 *  @param      {String}        method	- http요청의 method ( GET, POST, PUT, DELETE )
 *  @param      {Array}         pathname- http요청의 url을 /로 파싱한 Array
 *  @param      {Object}        params	- http요청의 body에 해당하는 내용
 *					- 현재는 사용하지 않으나 통일성 및 확장성을 위해 유지
 *  @param      {function}      callback- 이 함수에 대한 callback 함수
 *
 *  @description	- 유저정보를 DELETE 하는 쿼리를 생성하는 함수
 *			- 함수의 실행 프로세스는 따로 공유 Doc에 작성하고 간단한 주석만 중간에 삽입
 */
function unregister( method, pathname, params, callback ) {
	var response =  {
		key: params.key,
		errorcode: 0,
		errormessage: "success"
	}
	if ( pathname.length != 2 ){
		response.errorcode = 1
		response.errormessage = "Invalid URL"
		callback(response)
	} else {
		var db = server.use(config.UserDBConfig)
		var query = "DELETE VERTEX User WHERE "+
				"userId='"+ pathname[1] +"'"
		runQuery(response, query, callback )
	}
}
