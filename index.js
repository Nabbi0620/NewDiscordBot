const database = require("./database");
require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    PermissionFlagsBits
} = require("discord.js");

// ===============================
// 💙 하루봇 상태 체크
// ===============================

console.log("하루봇 코드 시작");


process.on("uncaughtException", err => {
    console.log("❌ 치명적 오류:", err);
});


process.on("unhandledRejection", err => {
    console.log("❌ Promise 오류:", err);
});


setInterval(() => {
    console.log("💙 하루봇 생존 확인", new Date().toLocaleString());
}, 60000);

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1530511828025872394";
const GUILD_ID = "1451481873229283500";



const client = new Client({

    intents:[
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]

});





// ===============================
// 📌 슬래시 명령어
// ===============================


const commands = [



new SlashCommandBuilder()
.setName("핑")
.setDescription("봇 상태 확인"),



new SlashCommandBuilder()
.setName("dm")
.setDescription("유저에게 DM 보내기")
.addUserOption(option =>
    option
    .setName("유저")
    .setDescription("보낼 유저")
    .setRequired(true)
)
.addStringOption(option =>
    option
    .setName("내용")
    .setDescription("내용")
    .setRequired(true)
),



new SlashCommandBuilder()
.setName("주사위")
.setDescription("주사위 굴리기"),




new SlashCommandBuilder()
.setName("가위바위보")
.setDescription("봇과 가위바위보")
.addStringOption(option =>
    option
    .setName("선택")
    .setDescription("가위 바위 보")
    .setRequired(true)
    .addChoices(
        {
            name:"✌️ 가위",
            value:"가위"
        },
        {
            name:"✊ 바위",
            value:"바위"
        },
        {
            name:"🖐️ 보",
            value:"보"
        }
    )
),




new SlashCommandBuilder()
.setName("채팅정보")
.setDescription("채팅 정보 확인"),



new SlashCommandBuilder()
.setName("채팅랭킹")
.setDescription("채팅 랭킹 확인"),



new SlashCommandBuilder()
.setName("청소")
.setDescription("메시지 삭제")
.addIntegerOption(option =>
    option
    .setName("개수")
    .setDescription("삭제할 개수")
    .setRequired(true)
),



new SlashCommandBuilder()
.setName("명령어목록")
.setDescription("전체 명령어 보기"),



new SlashCommandBuilder()
.setName("하루목록")
.setDescription("하루 대화 목록 보기")



].map(command=>command.toJSON());







// ===============================
// 📌 명령어 등록
// ===============================


const rest = new REST({

    version:"10"

}).setToken(TOKEN);



(async()=>{


try{


console.log("명령어 등록 중...");


await rest.put(

Routes.applicationGuildCommands(
CLIENT_ID,
GUILD_ID
),

{
body:commands
}

);


console.log("명령어 등록 완료!");



}catch(error){

console.error(error);

}


})();







// ===============================
// 🚀 로그인
// ===============================


client.once("clientReady", () => {


console.log(
`${client.user.tag} 로그인 완료!`
);


});








// ===============================
// ⭐ 레벨 시스템
// ===============================


client.on("messageCreate",message=>{


if(message.author.bot)
return;



const id =
message.author.id;


const name =
message.author.username;



let user =
database.get(id);



if(!user){


user={

name:name,

count:0,

level:0

};


}



user.count++;



const oldLevel =
user.level;



user.level =
Math.floor(
user.count / 100
);



database.set(
id,
user
);



if(user.level > oldLevel){


message.channel.send(

`╔═════════════════╗
🎉 레벨 업!
👤 ${name}
⭐ Lv.${user.level}
╚═════════════════╝`

);


}



});

// ===============================
// 📌 슬래시 명령어 처리
// ===============================


client.on("interactionCreate", async interaction=>{


if(!interaction.isChatInputCommand())
return;



await interaction.deferReply();





// ===============================
// 🏓 핑
// ===============================


if(interaction.commandName==="핑"){


return interaction.editReply(

`🏓 퐁!

🤖 봇 상태: 정상 작동
📡 핑: ${client.ws.ping}ms`

);


}





// ===============================
// 📩 DM
// ===============================


if(interaction.commandName==="dm"){


const user =
interaction.options.getUser("유저");


const text =
interaction.options.getString("내용");



try{


await user.send(text);



return interaction.editReply(
"✅ DM 전송 완료!"
);



}catch(error){


return interaction.editReply(
"❌ DM 전송 실패"
);


}



}







// ===============================
// 🎲 주사위
// ===============================


if(interaction.commandName==="주사위"){


const dice =
Math.floor(Math.random()*6)+1;



return interaction.editReply(

`🎲 주사위 결과

⭐ ${dice}`

);


}








// ===============================
// ✊ 가위바위보
// ===============================


if(interaction.commandName==="가위바위보"){


const user =
interaction.options.getString("선택");



const list=[

"가위",
"바위",
"보"

];



const bot =
list[
Math.floor(Math.random()*3)
];



let result;



if(user===bot){


result="🤝 무승부!";


}

else if(

(user==="가위" && bot==="보") ||
(user==="바위" && bot==="가위") ||
(user==="보" && bot==="바위")

){


result="🎉 승리!";


}

else{


result="😢 패배!";


}



return interaction.editReply(

`🎮 가위바위보

👤 나 : ${user}
🤖 하루 : ${bot}

${result}`

);


}








// ===============================
// 📊 채팅정보
// ===============================


if(interaction.commandName==="채팅정보"){


const user =
database.get(
interaction.user.id
);



if(!user){


return interaction.editReply(
"📭 아직 채팅 기록이 없습니다."
);


}



const next =
100 - (user.count % 100);



return interaction.editReply(

`📊 ${interaction.user.username}님의 정보

⭐ 레벨 : ${user.level}
💬 채팅 수 : ${user.count}개
⬆️ 다음 레벨까지 : ${next}개`

);


}








// ===============================
// 🏆 채팅랭킹
// ===============================


if(interaction.commandName==="채팅랭킹"){



const ranking =

Object.values(
database.getAll()
)

.sort(
(a,b)=>b.count-a.count
)

.slice(0,10);




let text =
`🏆 채팅 랭킹 TOP 10

`;



ranking.forEach((user,index)=>{


text +=

`${index+1}위. ${user.name}

💬 ${user.count}개
⭐ Lv.${user.level}

`;



});



if(ranking.length===0){

text="📭 기록이 없습니다.";

}



return interaction.editReply(text);


}









// ===============================
// 🧹 청소
// ===============================


if(interaction.commandName==="청소"){



if(
!interaction.member.permissions.has(
PermissionFlagsBits.ManageMessages
)

){


return interaction.editReply(
"🚫 메시지 관리 권한이 필요합니다."
);


}




const amount =
interaction.options.getInteger("개수");



if(amount < 1 || amount > 100){


return interaction.editReply(
"❌ 1~100 사이만 가능합니다."
);


}




try{


const deleted =
await interaction.channel.bulkDelete(
amount,
true
);



return interaction.editReply(

`🧹 ${deleted.size}개의 메시지를 삭제했습니다.`

);



}catch(error){


return interaction.editReply(
"❌ 삭제 실패"
);


}



}








// ===============================
// 📚 명령어 목록
// ===============================


if(interaction.commandName==="명령어목록"){


return interaction.editReply({

embeds:[{

color:0x87CEEB,

title:"📚 하루봇 명령어 목록",

description:

`
💙 기본

> /핑
> /명령어목록


🎮 게임

> /주사위
> /가위바위보


💬 채팅

> /채팅정보
> /채팅랭킹


📩 DM

> /dm


🧹 관리

> /청소


💙 하루 대화

> /하루목록

`

}]

});


}





// ===============================
// 💙 하루 목록
// ===============================


if(interaction.commandName==="하루목록"){


return interaction.editReply({

embeds:[{

color:0x87CEEB,

title:"💙 하루 대화 목록",

description:

`
description:


🌸 기본

> 하루야 안녕
> 하루야 뭐해?
> 하루야 누구야?
> 하루야 너의 엄마(아빠)는 누구야?


🎮 놀거리

> 하루야 게임 추천해줘
> 하루야 취미 추천해줘
> 하루야 할거 추천해줘
> 하루야 오늘 운세봐줘


🎬 영화 / 애니 / 음악

> 하루야 음악 추천해줘
> 하루야 영화 추천해줘
> 하루야 애니 추천해줘


🍚 음식

> 하루야 뭐 먹지?
> 하루야 메뉴 추천해줘
> 하루야 배고파


📚 공부

> 하루야 공부하기 싫어
> 하루야 시험 힘들어


💙 감정

> 하루야 힘들어
> 하루야 응원해줘
> 하루야 심심해
> 하루야 사랑해
> 하루야 귀여워
> 하루야 화이팅
> 하루야 고민 있어
> 하루야 걱정돼
> 하루야 고마워


💌 관계

> 하루야 사귀자
> 하루야 사겨
> 하루야 연애하자
> 하루야 결혼하자


😂 반응

> 하루야 웃겨
> 하루야 ㅋㅋ
> 하루야 최고야
> 하루야 잘했어
> 하루야 바보야


🌙 잠

> 하루야 잘자
> 하루야 졸려


🌏 날씨

> 하루야 너무 더워
> 하루야 너무 추워

`

}]

});


}



});






// ===============================
// 🌐 Render 유지용 웹 서버
// ===============================


const http = require("http");


const PORT =
process.env.PORT || 3000;



http.createServer((req,res)=>{


res.writeHead(200,{

"Content-Type":"text/plain"

});


res.end(
"Discord Bot is running!"
);



}).listen(PORT,()=>{


console.log(
`웹 서버 실행 중: ${PORT}`
);


});

// ===============================
// 💙 하루봇 대화 시스템
// ===============================

const responses = [


{
keys:["안녕","ㅎㅇ","하이","반가워"],
reply:[
"안녕하세요! 하루가 기다리고 있었어요 💙",
"어서와요 😊 오늘 하루는 어땠어요?",
"반가워요! 같이 이야기해요!",
"하루 등장! 오늘도 좋은 하루 보내요 ✨"
]
},


{
keys:["뭐해","머해","하고있어"],
reply:[
"하루는 여러분과 이야기하고 있어요 💙",
"항상 여기서 기다리고 있었어요 😊",
"여러분을 만나는 중이에요!",
"하루는 쉬는 시간에도 대기 중이에요 🤖"
]
},


{
keys:["게임","롤","배그","로블록스","스팀"],
reply:[
"게임 좋아하는군요! 🎮",
"친구들과 하는 게임은 더 재밌어요!",
"재밌는 게임 찾아볼까요? 😆",
"하루가 게임 추천 담당할게요 💙"
]
},


{
keys:["취미","취미추천"],
reply:[
"새로운 취미 찾아볼까요? 🎨",
"그림, 운동, 음악, 게임 같은 취미는 어때요?",
"하루랑 같이 재미있는 취미 찾아봐요 💙"
]
},


{
keys:["할거 추천","할거추천","뭐하지"],
reply:[
"게임, 영화, 산책 어떠세요? 😊",
"새로운 걸 도전해보는 것도 좋아요!",
"하루가 같이 고민해줄게요 💙"
]
},


{
keys:["음악","노래","노래추천"],
reply:[
"좋아하는 노래 장르가 있나요? 🎵",
"음악은 기분을 바꿔줘요 💙",
"플레이리스트 만들어볼까요?",
"좋은 노래 찾는 시간이에요 🎧"
]
},


{
keys:["영화","무비","볼만한"],
reply:[
"재밌는 영화 찾아볼까요? 🎬",
"액션 영화 좋아해요?",
"주말에 영화 한 편 어때요?",
"하루가 영화 추천해줄게요 💙"
]
},


{
keys:["애니","애니메이션"],
reply:[
"애니 좋아하는군요! ✨",
"좋아하는 작품이 있나요?",
"하루도 애니 이야기 좋아해요!",
"새로운 애니 찾아볼까요? 😊",
"귀멸의 칼날이나 주술회전 어떠세요?",
"진격의 거인과 나혼렙도 재밌어요!"
]
},


{
keys:["밥","음식","메뉴","배고파"],
reply:[
"맛있는 거 먹어요 🍗",
"치킨은 언제나 좋아요 😆",
"따뜻한 음식 추천해드릴게요!",
"배고프면 하루도 걱정돼요 💙"
]
},


{
keys:["공부","시험","숙제"],
reply:[
"조금씩 하면 충분해요 📚",
"하루가 응원할게요 💙",
"힘내요! 할 수 있어요 😊",
"공부 끝나면 꼭 쉬는 시간 가져요!"
]
},


{
keys:["졸려","잠","잘자"],
reply:[
"푹 쉬어요 🌙",
"좋은 꿈 꿔요 💙",
"오늘도 고생 많았어요!",
"내일 더 좋은 하루가 될 거예요 😊"
]
},


{
keys:["심심","할거없"],
reply:[
"하루랑 이야기해요 😆",
"같이 놀까요? 💙",
"재밌는 이야기 해봐요!",
"심심할 땐 하루 호출하기!"
]
},


{
keys:["사랑해"],
reply:[
"고마워요 💙",
"따뜻한 말 고마워요 😊",
"하루 기분 좋아졌어요!",
"좋은 말 해줘서 고마워요 ✨"
]
},


{
keys:["귀여워"],
reply:[
"고마워요 😊",
"더 귀여운 하루가 될게요 💙",
"칭찬 데이터 저장 완료 💾"
]
},


{
keys:["고마워","감사"],
reply:[
"별말씀을요 😊",
"언제든 불러주세요 💙",
"하루가 도와줄게요!"
]
},


{
keys:["누구","정체"],
reply:[
"저는 하루예요! 여러분과 이야기하는 봇이에요 💙",
"하루는 여러분의 작은 친구 같은 봇이에요 😊"
]
},


{
keys:["니 엄마","너의 엄마","니 아빠","너의 아빠"],
reply:[
"<@1235596247331766313>님 이에요! 😊",
"<@1235596247331766313>님이 저를 만들어주셨어요! 💙"
]
},


{
keys:["힘내","화이팅","응원"],
reply:[
"하루가 응원할게요 💙",
"분명 잘하고 있어요!",
"힘내요 😊",
"하루가 항상 응원할게요 ✨"
]
},

// 💌 관계 / 고백

{
keys:[
"사귀자",
"사겨",
"사귀어줘",
"연애하자",
"나랑 만나자",
"데이트하자",
"결혼하자",
"여친해줘",
"남친해줘"
],
reply:[
"어... 잠시만요 😳 하루는 봇이라 연애 기능이 없어요 💙",
"갑자기 고백이라니! 하루 준비 안 했는데요 😂",
"미안해요 😊 하루는 모두의 친구로 있을게요!",
"연애는 사람끼리 하는 거예요! 하루는 응원 담당이에요 💙",
"하루랑은 사귀기보다 오래 이야기하는 친구 어때요? 😆",
"개발자님께 연애 기능 추가 요청 넣어볼게요 🤖"
]
},


// 😂 웃음 반응

{
keys:[
"ㅋㅋ",
"ㅎㅎ",
"웃겨",
"재밌어",
"웃긴다"
],
reply:[
"ㅋㅋㅋ 하루도 웃었어요 😆",
"웃음 발견! 오늘 분위기 최고네요 💙",
"하루 개그 성공인가요? 😎",
"더 재미있는 이야기 찾아볼게요!",
"웃으면 하루 배터리 충전돼요 🔋"
]
},


// 😎 칭찬

{
keys:[
"최고",
"대단해",
"잘했어",
"멋있어",
"예쁘다",
"좋아"
],
reply:[
"칭찬 감사합니다 💙 하루 기분 +100 상승!",
"이런 말 들으면 힘나요 😊",
"하루 경험치 상승 완료 ✨",
"칭찬 저장 완료 💾",
"더 좋은 하루가 되도록 노력할게요!"
]
},


// 😈 장난 / 놀림

{
keys:[
"바보",
"멍청",
"못생겼어"
],
reply:[
"앗 공격 감지 🤖 하지만 하루 방어 성공!",
"하루는 아직 성장 중이에요 😎",
"팩트 공격 너무 강해요 ㅋㅋ",
"다음 업데이트 때 더 발전할게요 💙",
"그래도 하루는 포기하지 않아요 😊"
]
},


// 🤖 하루봇

{
keys:[
"로봇",
"봇",
"AI",
"인공지능"
],
reply:[
"하루는 AI 봇이에요 🤖💙",
"하루는 코드로 만들어진 친구예요!",
"계속 업데이트하면서 성장 중이에요 ✨",
"하지만 대화할 때는 따뜻하게 이야기하고 싶어요 😊"
]
},


// 🎮 게임 추천

{
keys:[
"게임추천",
"할게임",
"재밌는게임"
],
reply:[
"어떤 장르 좋아해요? 🎮",
"PC 게임인지 모바일인지 알려주세요!",
"하루가 취향 맞춰서 찾아볼게요 💙",
"친구와 같이 하는 게임은 더 재밌어요!"
]
},


// 🍀 운세

{
keys:[
"운세",
"오늘운",
"행운"
],
reply:[
"오늘의 운세! 좋은 일이 찾아올 가능성이 높아요 🍀",
"작은 행운이 찾아오는 하루가 될 거예요 💙",
"웃는 일이 많은 하루가 되길 바랄게요 😊",
"운세보다 중요한 건 직접 만드는 거예요!"
]
},


// 🌦 날씨

{
keys:[
"더워",
"추워",
"날씨",
"비와"
],
reply:[
"날씨 때문에 힘들죠 😭 건강 챙겨요!",
"물 많이 마시고 감기 조심해요 💙",
"외출 전 날씨 확인하는 것도 좋아요!",
"하루가 날씨까지 걱정해줄게요 😊"
]
},


// 🥺 위로

{
keys:[
"힘들어",
"걱정돼",
"고민있어",
"고민 있어",
"슬퍼",
"우울해"
],
reply:[
"많이 힘들었군요... 하루가 들어줄게요 💙",
"괜찮아요. 천천히 해도 돼요 😊",
"혼자 고민하지 말고 이야기해줘요",
"하루가 항상 응원할게요 ✨",
"오늘도 정말 고생 많았어요"
]
},


// 🤔 질문

{
keys:[
"왜",
"어떻게",
"뭐야",
"알려줘"
],
reply:[
"하루가 아는 내용이면 알려드릴게요 😊",
"궁금한 걸 조금 더 자세히 말해주세요!",
"같이 찾아볼까요? 💙"
]
},


// 👋 작별

{
keys:[
"잘가",
"안녕히가",
"나갈게"
],
reply:[
"또 놀러 와요 💙",
"다음에 또 만나요 😊",
"하루는 여기서 기다리고 있을게요!"
]
}


];


// ===============================
// ❓ 모르는 말
// ===============================


const unknownReplies = [

"어라? 처음 듣는 말이에요 😳",

"하루가 아직 모르는 말이에요 💙",

"조금 더 알려줄 수 있나요? 😊",

"음... 아직 공부가 필요해요!"

];



// ===============================
// 😈 욕 반응
// ===============================


const badWords = [

"시발",
"씨발",
"ㅅㅂ",
"병신",
"ㅂㅅ",
"개새끼",
"꺼져",
"닥쳐",
"좆까"

];


const angryReplies = [

"하루한테 왜 그래요 😢",

"말 조심해주세요 😤",

"하루 삐질 거예요 😠",

"진정하세요! 하루는 착한 봇이에요 💙"

];





// ===============================
// 💬 하루 대화 처리
// ===============================


client.on("messageCreate", async message=>{


    if(message.author.bot)
        return;



    const msg =
    message.content.trim();



    // ===============================
    // 💙 하루야 단독 호출
    // ===============================


    if(msg === "하루야"){


        const call = [

            "네! 하루 여기 있어요 💙",

            "부르셨어요? 😊",

            "네, 무슨 일이에요?",

            "하루 왔어요! ✨"

        ];


        return message.reply(
            call[
                Math.floor(
                    Math.random()*call.length
                )
            ]
        );


    }




    // ===============================
    // 하루야 없으면 무시
    // ===============================


    if(!msg.includes("하루야"))
        return;




    // ===============================
    // 욕 감지
    // ===============================


    if(
        badWords.some(
            word=>msg.includes(word)
        )
    ){


        return message.reply(

            angryReplies[
                Math.floor(
                    Math.random()*angryReplies.length
                )
            ]

        );

    }





    // ===============================
    // 키워드 검색
    // ===============================


    for(
        const data of responses
    ){


        if(
            data.keys.some(
                key=>msg.includes(key)
            )
        ){


            return message.reply(

                data.reply[
                    Math.floor(
                        Math.random()*data.reply.length
                    )
                ]

            );


        }


    }





    // ===============================
    // 모르는 말
    // ===============================


    return message.reply(

        unknownReplies[
            Math.floor(
                Math.random()*unknownReplies.length
            )
        ]

    );


});






// ===============================
// 🚀 봇 실행
// ===============================


client.login(TOKEN);

client.on("disconnect", () => {
    console.log("❌ Discord 연결 끊김");
});

client.on("reconnecting", () => {
    console.log("🔄 Discord 재연결 중");
});

client.on("shardError", error => {
    console.log("⚠️ Shard 오류:", error);
});

client.on("error", error => {
    console.log("⚠️ Discord 오류:", error);
});