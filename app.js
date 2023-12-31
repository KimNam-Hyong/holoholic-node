
/**
 * Socket.IO 사용하기
 * 
 * 그룹 채팅하기
 * 
 * 'login' 이벤트 처리
 * 'message' 이벤트 처리할 때 command가 'groupchat'인 경우 해당 room 정보 찾아서 메시지 전송
 * 'room' 이벤트 처리 (command : create, update, delete, list)
 */

//===== 모듈 불러들이기 =====//
var express = require('express')
  , http = require('http')
  , user = require('./routes/user')
  , path = require('path');
var routes = require('./routes');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var expressErrorHandler = require('express-error-handler');
var mysql=require('mysql');
var async=require('async');
//===== Socket.IO 사용 =====//
var socketio = require('socket.io');

//===== cors 사용 - 클라이언트에서 ajax로 요청 시 CORS(다중 서버 접속) 지원 =====//
var cors = require('cors');
//===== Express 서버 객체 만들기 =====//
var app = express();
//===== 뷰 엔진 설정 =====//
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
//===== 서버 변수 설정 및 static으로 public 폴더 설정  =====//
app.set('port', process.env.PORT || 8010);
app.use('/public', express.static(path.join(__dirname, 'public')));
//===== body-parser, cookie-parser, express-session 사용 설정 =====//
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressSession({
	secret:'my key',
	resave:true,
	saveUninitialized:true
}));
//클라이언트에서 ajax로 요청 시 CORS(다중 서버 접속) 지원
app.use(cors());
//===== 라우터 미들웨어 사용 =====//
app.use(app.router);

//===== 404 에러 페이지 처리 =====//
var errorHandler = expressErrorHandler({
 static: {
   '404': './public/404.html'
 }
});
app.use( expressErrorHandler.httpError(404) );
app.use( errorHandler );
//===== 서버 시작 =====//
//확인되지 않은 예외 처리 - 서버 프로세스 종료하지 않고 유지함
process.on('uncaughtException', function (err) {
	//console.log('uncaughtException 발생함 : ' + err);
	//console.log('서버 프로세스 종료하지 않고 유지함.');
	
	//console.log(err.stack);
});
// 프로세스 종료 시에 데이터베이스 연결 해제
process.on('SIGTERM', function () {
    //console.log("프로세스가 종료됩니다.");
    app.close();
});
app.on('close', function () {
	//console.log("Express 서버 객체가 종료됩니다.");
});
// 시작된 서버 객체를 리턴받도록 합니다. 
var server = http.createServer(app).listen(app.get('port'), function(){
	//console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));
   
});
// 로그인 아이디 매핑 (로그인 ID -> 소켓 ID)
var login_ids = {};
// 방안에 유저 정보 매핑
var room_user_id={};
// 방 아이디 매핑하기
var room_ids = {};
// socket.io 서버를 시작합니다.
var io = socketio.listen(server);
//io.adapter(redis({host:'varopetredis.cafe24.com',port:21660}));
//console.log('socket.io 요청을 받아들일 준비가 되었습니다.');
// 클라이언트가 연결했을 때의 이벤트 처리
io.sockets.on('connection', function(socket) {
	//console.log('connection info :', socket.request.connection._peername);
    // 소켓 객체에 클라이언트 Host, Port 정보 속성으로 추가
    socket.remoteAddress = socket.request.connection._peername.address;
    socket.remotePort = socket.request.connection._peername.port;
    // 'login' 이벤트를 받았을 때의 처리
    socket.on('login', function(login) {
    	console.dir(login);
		console.log("login"+login);
        // 기존 클라이언트 ID가 없으면 클라이언트 ID를 맵에 추가
        //console.log('접속한 소켓의 ID : ' + socket.id);
        login_ids[login.id] = socket.id;
        socket.login_id = login.id;
		console.log(login_ids[login.id]+'///');
        //console.log('접속한 클라이언트 ID 갯수 : %d', Object.keys(login_ids).length);
        // 응답 메시지 전송
        var statusObj={status:'200',id:login.id,message:login.id+'님이 로그인이 되었습니다.'}
        socket.emit('response',statusObj);
        //sendResponse(socket, 'login', '100', login.id+'님이 로그인되었습니다.');
    });
    // 'message' 이벤트를 받았을 때의 처리
    socket.on('message', function(message) {
    	//io.sockets.in(message.roomId).emit("message",message)
        console.log(message);
		
		if(login_ids[message.s_id]!=undefined){
			console.log(login_ids[message.s_id]);
			io.sockets.connected[login_ids[message.s_id]].emit('message',message);
        }

        /*try{
            io.sockets.emit('message', message);
        }catch(err){

        }*/
    	//io.sockets.in(message.roomId).emit("message",message);
    	/*
        if (message.recepient =='ALL') {
            // 나를 포함한 모든 클라이언트에게 메시지 전달
        	console.dir('나를 포함한 모든 클라이언트에게 message 이벤트를 전송합니다.')
            io.sockets.emit('message', message);
        } else {
        	// 일대일 채팅 대상에게 메시지 전달
        	
        	if (login_ids[message.recepient]) {
        		io.sockets.connected[login_ids[message.recepient]].emit('message', message);
        		
        		// 응답 메시지 전송
                sendResponse(socket, 'message', '200', '메시지를 전송했습니다.');
        	} else {
        		// 응답 메시지 전송
                sendResponse(socket, 'login', '404', '상대방의 로그인 ID를 찾을 수 없습니다.');
        	}
        }*/
    });
	socket.on("emailCertification",function(message){
		console.log(message);
		if(login_ids[message.mb_email]!=undefined){
			io.sockets.connected[login_ids[message.mb_email]].emit('emailcertification',message);
        }
	});
    socket.on('keyinput',function(data){
       io.sockets.in(data.roomId) .emit("output",data);
    });
    // 'room' 이벤트를 받았을 때의 처리
    socket.on('room', function(room) {
    	//console.log('room 이벤트를 받았습니다.');
    	console.dir(room);
        if (room.command === 'create') {
        	if (io.sockets.adapter.rooms[room.roomId]) { // 방이 이미 만들어져 있는 경우
        		//console.log('방이 이미 만들어져 있습니다.');
        	} else {
        	}

        } else if (room.command === 'update') {
            var curRoom = io.sockets.adapter.rooms[room.roomId];
            curRoom.id = room.roomId;
            curRoom.name = room.roomName;
            curRoom.owner = room.roomOwner;
             
        } else if (room.command === 'delete') {
            socket.leave(room.roomId);
            if (io.sockets.adapter.rooms[room.roomId]) { // 방이  만들어져 있는 경우
            	delete io.sockets.adapter.rooms[room.roomId];
            } else {  // 방이  만들어져 있지 않은 경우
            	//console.log('방이 만들어져 있지 않습니다.');
            }
        }else if(room.command=="out"){
			var curRoom = io.sockets.adapter.rooms[room.roomId];
			socket.room=room.roomId;
            curRoom.userId = room.chatId;
            var data3={room_id:room.roomId,id:room.mb_id,in_out:1,mb_name:room.mb_name};
            io.sockets.in(room.roomId).emit("chatOut",data3);
		}else if(room.command==="in"){
            socket.join(room.roomId);
            var curRoom = io.sockets.adapter.rooms[room.roomId];
			socket.room_id=room.roomId;
			socket.name=room.mb_name;
            curRoom.userId = room.chatId;
            var data3={room_id:room.roomId,id:room.mb_id,in_out:1,mb_name:room.mb_name};
            io.sockets.in(room.roomId).emit("chatIn",data3);
            /*var tasks=[
                function (callback){
                    dbUtil.roomClientList(data3,callback);
                },
                function (result,callback){
                    if(0<result.length){
                       
                        dbUtil.roomClientInUpdate(data3,callback);
                    }else{
                        dbUtil.roomClientIn(data3,callback);
                    }
                },
                function (data,callback){
                   
                    dbUtil.roomClientList2(data3,callback);
                },
                function (row,callback){
                    var userList=[];
                    for(var i=0;i<row.length;i++){
                        userList={
                            id:row[i].id
                        }
                        users.push(userList);
                    }
                    
                    io.sockets.in(room.roomId).emit('userList',users);
                }
           ];
           async.waterfall(tasks);*/
        }
         var roomList = getRoomList();
         var output = {command:'list', rooms:roomList};
         io.sockets.emit('room', output);
        
    });
    //채팅방 초대 또는 웹알림
    socket.on("invite",function(json){
        //console.log(json);
        var data=json;
        //console.log(json);
        var mb_id=data.mb_id;
        if(login_ids[mb_id]!=undefined){
            io.sockets.connected[login_ids[mb_id]].emit("invite",data);
        }else{
            //푸시 보내기
        }
    });
    //브라우저가 닫혔을 때 방나가기
	socket.on('disconnect',function(){
		//console.log('브라우저 닫음');
		var availableRooms = [];
    
        var rooms = io.sockets.adapter.rooms;
        
        if(rooms){
            for(var room in rooms){
                if(!rooms[room].hasOwnProperty(room)){
                    //console.log(room);
                    availableRooms.push(room);
                }
            }     
        }
		console.log(socket.room+"///");
		if(socket.login_id!=undefined){
			var data={mb_id:socket.login_id,room_id:socket.room_id,mb_name:socket.name};
			console.log(data);
			io.sockets.in(socket.room_id).emit('chatOut',data);
		}
		//io.sockets.connected[login_ids[socket.login_id]].emit("chatOut",{mb_id:socket.login_id});
        //console.log("브라우저:"+socket.login_ids);
		/*if(socket.login_id!=undefined){
			//delete login_ids[socket.login_id];
		
			var datas={id:socket.login_id};
			
			var users=[];
			var roomid;
			var tasks=[
                function (callback){
                    dbUtil.roomExit(datas,callback);
                },
                function (data,callback){
                    //console.log("유저조회");
                    dbUtil.roomClient(datas,callback);
                },
                function (row,callback){
                    //console.log(row[0]);
                    var data={id:row[0].id,room_id:row[0].room_id}
                    roomid=row[0].room_id;
                    dbUtil.roomClientList2(data,callback);
                },
                function (row,callback){
                    var userList=[];
                    for(var i=0;i<row.length;i++){
                        userList={
                            id:row[i].id
                        }
                        users.push(userList);
                    }
                    //console.log("유저"+users);
                    io.sockets.in(roomid).emit('userList',users);
                }
                
                
           ];
           async.waterfall(tasks);
		}*/
	});
	
	
});
setInterval(function(){
	io.sockets.emit("wakeUp","1");
	console.log("111");
},1000*60);
function getRoomList() {
	console.dir(io.sockets.adapter.rooms);
    var roomList = [];
    Object.keys(io.sockets.adapter.rooms).forEach(function(roomId) { // for each room
    	//console.log('current room id : ' + roomId);
    	var outRoom = io.sockets.adapter.rooms[roomId];
    	// find default room using all attributes
    	var foundDefault = false;
    	var index = 0;
        Object.keys(outRoom).forEach(function(key) {
        	//console.log('#' + index + ' : ' + key + ', ' + outRoom[key]);
        	if (roomId == key) {  // default room
        		foundDefault = true;
        		//console.log('this is default room.');
        	}
        	index++;
        });
        if (!foundDefault) {
        	roomList.push(outRoom);
        }
    });
    //console.log('[ROOM LIST]');
    console.dir(roomList);
    return roomList;
}
// 응답 메시지 전송 메소드
function sendResponse(socket, command, code, message) {
	var statusObj = {command: command, code: code, message: message};
	socket.emit('response', statusObj);
}