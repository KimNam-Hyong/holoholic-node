module.exports = {
	//방만들기 인서트
	createRoom : function(data,callback){
		
	    global.pool.getConnection(function(err, conn) {
			if (err) {
				console.dir(err);
				//conn.release();
				return;
			}
			var datas=JSON.parse(JSON.stringify(data));
			
			var exec = conn.query('insert into chat_room set ?', data,
					function(err, result) {
						conn.release();
						
						console.log('실행 대상 SQL : ' + exec.sql);
						if (err) {
							console.log('오류 발생');
							callback(err, null);
							return;
						}
						
						callback(null, result);
					});
		});
	},
	roomClientList:function(data,callback){
		console.log('장치 조회하기');
		global.pool.getConnection(function(err, conn) {
		/*	var room_id = data.room_id;
			var id = data.id;
			console.log("유저아이디"+id);
			var exec = conn.query("select * from chat_client where room_id='"
					+ room_id + "' and id='"+id+"'", data, function(err, result) {
				conn.release();
				console.log('실행 대상 SQL : ' + exec.sql);
				if (err) {
					console.log('오류 발생');
					callback(err, null);
					return;
				}
				console.log("조회하기");
				callback(null, result);
			});*/
		});
	},
	roomClientIn:function(data,callback){
		global.pool.getConnection(function(err, conn) {
			if (err) {
				console.dir(err);
				//conn.release();
				return;
			}
			var datas=JSON.parse(JSON.stringify(data));
			
			var exec = conn.query('insert into chat_client set ?', data,
					function(err, result) {
						conn.release();
						
						console.log('실행 대상 SQL : ' + exec.sql);
						if (err) {
							console.log('오류 발생');
							callback(err, null);
							return;
						}
						
						callback(null, result);
					});
		});
	},
	roomClientInUpdate:function(data,callback){
		global.pool.getConnection(function(err, conn) {
			if (err) {
				console.dir(err);
				//conn.release();
				return;
			}
			var datas=JSON.parse(JSON.stringify(data));
			var room_id=data.room_id;
			var id=data.id;
			var exec = conn.query("update chat_client set in_out='1' where room_id='"+room_id+"' and id='"+id+"'", data,
					function(err, result) {
						conn.release();
						
						console.log('실행 대상 SQL : ' + exec.sql);
						if (err) {
							console.log('오류 발생');
							callback(err, null);
							return;
						}
						
						callback(null, result);
					});
		});
	},
	roomClientList2:function(data,callback){
		global.pool.getConnection(function(err, conn) {
			var room_id = data.room_id;
			var id = data.id;
			console.log("유저아이디"+id);
			var exec = conn.query("select * from chat_client where room_id='"
					+ room_id+"' and in_out='1'" , data, function(err, result) {
				conn.release();
				console.log('실행 대상 SQL : ' + exec.sql);
				if (err) {
					console.log('오류 발생');
					callback(err, null);
					return;
				}
				console.log("조회하기");
				callback(null, result);
			});
		});
	},
	roomClient:function(data,callback){
		global.pool.getConnection(function(err, conn) {
			var room_id = data.room_id;
			var id = data.id;
			console.log("유저아이디"+id);
			var exec = conn.query("select * from chat_client where id='"+id+"'" , data, function(err, result) {
				conn.release();
				console.log('실행 대상 SQL : ' + exec.sql);
				if (err) {
					console.log('오류 발생');
					callback(err, null);
					return;
				}
				console.log("조회하기");
				callback(null, result);
			});
		});
	},
	roomExit:function(data,callback){
		global.pool.getConnection(function(err, conn) {
			
			var id = data.id;
			var room_id=data.room_id;
			console.log("유저아이디"+id);
			var exec = conn.query("update chat_client set in_out='0' where id='"
					+ id+"'" , data, function(err, result) {
				conn.release();
				console.log('실행 대상 SQL : ' + exec.sql);
				if (err) {
					console.log('오류 발생');
					callback(err, null);
					return;
				}
				console.log("방나가기");
				callback(null, result);
			});
		});
	}
	
}