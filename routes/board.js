var express=require('express');
var router=express.Router();

var result;

//MySQL loading
var mysql=require('mysql');
var pool=mysql.createPool({
    connctionLimit: 5,
    host: 'localhost',
    user: 'root',
    database: 'tutorial',
    password: '1234'
});

///////////////////////////////////////////////////////////////
//파일관련 모듈
var multer = require('multer')

//파일 저장위치와 파일이름 설정
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        //파일이 이미지 파일이면
        if (file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png") {
            console.log("이미지 파일이네요")
            cb(null, 'uploads/images')
            //텍스트 파일이면
        } else if (file.mimetype == "application/pdf" || file.mimetype == "application/txt" || file.mimetype == "application/octet-stream") {
            console.log("텍스트 파일이네요")
            cb(null, 'uploads/texts')
        }
    },
    //파일이름 설정
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname)
}

})
//파일 업로드 모듈
var upload = multer({ storage: storage })

router.post('/write/image_upload', upload.single('fileupload'), function (req, res) {
    console.log("켈로그")
    console.log(req.file)
    console.log(req.file.path)
    console.log(upload)
    console.log(upload.storage.getFilename)
    
    //파일 위치를 mysql 서버에 저장
    //getConnection().query('insert into myfile(name) values (?)', [req.file.path], function () {
    
      //  res.redirect('/filepage');
    //});
});
    
    

///////////////////////////////////////////////////////////////

/*GET users listing*/
router.get('/', function(req, res, next){
    //그냥 board/로 접속할 경우, 전체 목록 표시로 리다이렉트
    res.redirect('/board/list/1');
});

router.get('/list/:page', function(req,res,next){

    pool.getConnection(function(err,connection){
        //Use the connection
        var sqlForSelectList = "SELECT idx, creator_id, title, hit FROM board";
        connection.query(sqlForSelectList, function(err, rows){
            if(err)console.error("err : "+err);
            console.log("rows : " + JSON.stringify(rows));

            res.render('list', {title: '게시판 전체 글 조회', rows: rows});
            connection.release();

            //Don't use the connection here, it has been returned th the pool
        });
    });

});
//글쓰기 화면 표시 GET
router.get('/write',function(req,res,next){
    res.render('write', {title: "게시판 글 쓰기"});
});

//글 쓰기 로직 처리 POST
router.post('/write', function(req,res,next){
    var creator_id = req.body.creator_id;
    var title = req.body.title;
    var content = req.body.content;
    var passwd = req.body.passwd;
    var datas = [creator_id, title, content, passwd];
    console.log(datas);
    pool.getConnection(function(err, connection){
        //Use the connection
        var sqlForInsertBoard = "INSERT INTO board(creator_id, title, content, passwd) value(?,?,?,?)";
        console.log(datas);
        connection.query(sqlForInsertBoard, datas, function(err,rows){
            if (err) console.error("err : " + err);
            console.log("rows : " + JSON.stringify(rows));

            res.redirect('/board');
            connection.release();

            //Don't use the connection here. it has been returned to the pool.
        });
    });
});

//글 조회 로직 처리 GET
router.get('/read/:idx', function(req, res, next){
    var idx=req.params.idx;

    pool.getConnection(function(err, connection){
        var sql="SELECT idx, creator_id, title, content, hit FROM board WHERE idx=?";

        connection.query(sql,[idx],function(err,row){
            if(err) console.error(err);
            console.log("1개 글 조회 결과 확인 : ",row);
            res.render('read', {title: "글 조회", row:row[0]});
            connection.release();
        });
    });
});

//글 수정 화면 표시 GET
router.get('/update', function(req, res, next){
    var idx = req.query.idx;

    pool.getConnection(function(err, connection){
        if(err) console.error("커넥션 객체 얻어오기 에러 : ", err);

        var sql = "SELECT idx, creator_id, title, content, hit FROM board WHERE idx=?";
        connection.query(sql, [idx], function(err, rows){
            if(err) console.error(err);
            console.log("update에서 1개 글 조회 결과 확인 : ", rows);
            res.render('update', {title:"글 수정", row:rows[0]});
            connection.release();
        });
    });
});

//글 수정 로직 처리 POST
router.post('/update', function(req, res, next){
    var idx = req.body.idx;
    var creator_id = req.body.creator_id;
    var title = req.body.title;
    var content = req.body.content;
    var passwd = req.body.passwd;
    var datas = [creator_id, title, content, idx, passwd];
    console.log(datas)
    pool.getConnection(function(err,connection){
        var sql = "UPDATE board SET creator_id=?, title=?, content=? WHERE idx=? AND passwd=?";
        connection.query(sql, [creator_id,title,content,idx,passwd],function(err,result){
            console.log(result);
            if(err) console.error("글 수정 중 에러 발생 err : ", err);
            console.log(result);
            if(result.affectedRows == 0){
                console.log("1");
                res.send("<script>alert('패스워드가 일치하지 않거나, 잘못된 요청으로 인해 변경되지 않았습니다.');history.back();</script>");
                console.log("2");
            }
            else{
                console.log("3");
                res.redirect('/board/read/'+idx);
                console.log("4");
            }
            console.log("5");
            connection.release();
        });
    });
});



router.delete('/delete', function(req, res,next){
    var idx=req.body.idx;
    var passwd=req.body.passwd;
    var datas = [idx,passwd];
    pool.getConnection(function(err, connection){
        var sql="DELETE from board WHERE idx=? and passwd=?";
        connection.query(sql, datas, function(err, result){
        if(err)console.error(err);
        if(result.affectedRows==0)
        {
            res.send("<script>alert('패스워드가 일치하지 않습니다.');history.back();</script>");
        }
        else{
            res.redirect('board/list/');
        }
    })
    
    });
});


module.exports = router;