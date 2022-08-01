const express = require('express');
const app = express();
const path = require('path');
app.use(express.urlencoded({extended : true}));
require('dotenv').config();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB 접속 쉽게 도와주는 라이브러리 require
const MongoClient = require('mongodb').MongoClient;

var db;
MongoClient.connect(process.env.DB_URL, function(에러, client){
  if (에러) return console.log(에러);
  db = client.db('board');

  app.listen(process.env.PORT, ()=>{
    console.log('8080 연결 성공')
  });  
})

// 로그인, 세션생성을 도와줄 라이브러리 설치 후 require
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 

//.아이디, 비번 인증(DB와 맞는지 비교)
passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
  console.log(입력한아이디, 입력한비번);
  db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
    if (에러) return done(에러)

    if (!결과) return done(null, false, { message: '존재하지 않는 아이디입니다.' })
    if (입력한비번 == 결과.pw) {
      return done(null, 결과)
    } else {
      return done(null, false, { message: '비밀번호가 올바르지 않습니다.' })
    }
  })
}));

app.get('/', (요청, 응답)=>{
  응답.render('index.ejs');
})

app.post('/', passport.authenticate('local', {failureRedirect: '/', failureFlash: true}), function(요청, 응답){
  응답.redirect('/list');
  console.log('로그인 성공');
});

//세션만들고 세션아이디 발급해서 쿠키로 보내주기
passport.serializeUser(function (user, done) {
  done(null, user.id)
});

passport.deserializeUser(function (아이디, done) {
  db.collection('login').findOne({ id: 아이디 }, function (에러, 결과) {
    done(null, 결과)
  })
});

//로그인하면 list페이지로 라우팅
function login(요청, 응답, next) {
  if(요청.user) {
    next()
  } else {
    응답.send('<script>alert("로그인 해주세요")</script>');
  }
}

//로그인 여부 확인후, 페이지 불러오기(user정보도 같이 보내줌)
app.get('/list', login, (요청, 응답)=>{
  db.collection('post').find().toArray(function(에러, 결과) {
    응답.render('list.ejs', { posts: 결과, 사용자 : 요청.user });
  }); 
})

app.get('/detail', login, (요청, 응답)=>{
  응답.render('detail.ejs', {사용자 : 요청.user});
})

app.get('/update', login, (요청, 응답)=>{
  응답.render('update.ejs', {사용자 : 요청.user});
})

app.get('/write', login, (요청, 응답)=>{
  응답.render('write.ejs', {사용자 : 요청.user});
})

app.post('/write', (요청, 응답) =>{
  응답.render('write.ejs');
  var 저장할거 =  { 제목 : 요청.body.title, 내용 : 요청.body.content, 작성자: 요청.user._id}

  //새로운 데이터를 post컬렉션에 저장
  db.collection('post').insertOne(저장할거, function(에러, 결과){
    console.log('저장완료')
  });
})