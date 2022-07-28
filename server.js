const express = require('express');
const app = express();
app.use(express.urlencoded({extended : true}));
app.set('view engine', 'ejs');
require('dotenv').config();


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

app.post('/', passport.authenticate('local', {failureMessage : '아이디와 비밀번호를 다시 확인해주세요'}), function(요청, 응답){
  응답.redirect('/');
  console.log('로그인 성공');
});

passport.serializeUser(function (user, done) {
  done(null, user.id)
});

passport.deserializeUser(function (아이디, done) {
  done(null, {})
}); 