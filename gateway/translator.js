exports.trans = ( request, params ) => {
	if( request == "userlist" ){
		return [{	method: "GET",
				url:	"/user/userid/"+params.userId,
				needs:	["userId","nickname"]},
			{
				method: "GET",
				url:	"/user/userid/"+params.userId,
				needs:	["password"]}]
}
