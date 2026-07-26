const database = require("./database");
require("dotenv").config();

process.on("uncaughtException", err => {
    console.log("오류 발생:", err);
});

process.on("unhandledRejection", err => {
    console.log("Promise 오류:", err);
});

const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    PermissionFlagsBits
} = require("discord.js");



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


client.once("ready",()=>{


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
🌸 기본

> 하루야 안녕
> 하루야 뭐해?
> 하루야 누구야?
> 하루야 너의 엄마는 누구야?


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


📚 공부

> 하루야 공부하기 싫어


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
// 💙 하루봇 대화 데이터
// ===============================


const responses = [


// 인사
{
keys:["안녕","ㅎㅇ","하이","반가워"],
reply:[
"안녕하세요! 하루가 기다리고 있었어요 💙",
"어서와요 😊 오늘 하루는 어땠어요?",
"반가워요! 같이 이야기해요!"
]
},



// 뭐해
{
keys:["뭐해","머해","하고있어"],
reply:[
"하루는 여러분과 이야기하고 있어요 💙",
"항상 여기서 기다리고 있었어요 😊",
"여러분을 만나는 중이에요!"
]
},



// 게임
{
keys:["게임","롤","배그","로블록스","스팀"],
reply:[
"게임 좋아하는군요! 🎮 재밌는 게임 찾아볼까요?",
"친구들과 하는 게임은 더 재밌어요!",
"롤, 배그, 스팀 게임도 좋아요 😆"
]
},



// 음악
{
keys:["음악","노래","노래추천","플레이리스트"],
reply:[
"기분에 맞는 노래를 찾아보는 건 어때요? 🎵",
"잔잔한 음악도 좋고 신나는 음악도 좋아요!",
"좋아하는 장르가 있으면 추천해줄게요 💙"
]
},



// 영화
{
keys:["영화","무비","볼만한"],
reply:[
"액션 영화 좋아해요? 🎬",
"감동적인 영화도 추천해줄 수 있어요!",
"주말에는 영화 한 편 어때요?"
]
},



// 애니
{
keys:["애니","애니메이션"],
reply:[
"애니 좋아하는군요! ✨",
"재밌는 작품 찾아볼까요?",
"좋아하는 장르가 있나요?"
]
},



// 음식
{
keys:["밥","먹지","음식","메뉴","배고파"],
reply:[
"치킨 어떨까요? 🍗",
"따뜻한 국밥도 좋아요 🍚",
"파스타도 맛있어요 🍝"
]
},



// 공부
{
keys:["공부","시험","숙제","공부하기싫"],
reply:[
"조금만 시작해도 충분해요 📚",
"10분만 해보는 건 어때요? 😊",
"하루가 응원할게요!"
]
},



// 잠
{
keys:["졸려","잠","자고싶","잘자"],
reply:[
"푹 쉬어요 🌙",
"좋은 꿈 꿔요 💙",
"오늘도 고생 많았어요!"
]
},



// 날씨
{
keys:["날씨","비","눈","더워","추워"],
reply:[
"날씨 확인하고 따뜻하게 입어요 ☁️",
"우산 챙기는 것도 잊지 마요 ☔",
"감기 조심하세요 💙"
]
},



// MBTI
{
keys:["mbti","MBTI","성격"],
reply:[
"MBTI는 재미로 보는 게 좋아요 😊",
"어떤 유형인지 궁금하네요!",
"모두 각자의 매력이 있어요 💙"
]
},



// 취미
{
keys:["취미","놀거리","할거"],
reply:[
"좋아하는 취미가 있나요? 🎨",
"게임, 음악, 운동도 좋은 취미예요!",
"새로운 걸 시작해보는 것도 좋아요!"
]
},

// 응원
{
keys:["응원","힘내","화이팅","힘들어"],
reply:[
"하루가 항상 응원할게요 💙",
"분명 잘하고 있어요!",
"천천히 해도 괜찮아요 😊"
]
},



// 고민
{
keys:["고민","걱정","스트레스"],
reply:[
"하루에게 이야기해도 괜찮아요 💙",
"천천히 같이 생각해봐요.",
"좋은 방향을 찾아봐요!"
]
},



// 심심
{
keys:["심심","할거없"],
reply:[
"하루랑 이야기해요 😆",
"재밌는 이야기 해볼까요?",
"같이 놀아요 💙"
]
},



// 사랑
{
keys:["사랑해"],
reply:[
"고마워요 💙",
"따뜻한 말 고마워요 😊",
"하루 기분 좋아졌어요!"
]
},

// 엄마
{
keys:["너의 엄마"],
reply:[
"<@1235596247331766313> 님 이에요!",
]
},

// ⭐ 사귀기
{
keys:[
"사귀자",
"사귈래",
"사귀어줘",
"사겨",
"연애하자"
],

reply:[

"나가주세요 ..ㅎㅎ.. 하루는 봇이에요 😐",

"죄송하지만 하루는 연애 기능이 없어요 💙",

"그건 어려워요 😅 하루는 친구로만 지낼게요!",

"갑자기요...? 하루 조금 당황했어요 😳",

"사귀는 건 안 되지만 이야기 상대는 해줄게요 😊"

]

},



// 귀여워
{
keys:["귀여워"],
reply:[
"고마워요 😊",
"더 귀여운 하루가 될게요 💙"
]
},



// 고마워
{
keys:["고마워","감사"],
reply:[
"별말씀을요 😊",
"언제든 불러주세요 💙"
]
},



// 누구
{
keys:["누구","정체"],
reply:[
"저는 하루예요! 여러분과 이야기하는 봇이에요 💙"
]
},



// 운세
{
keys:["운세","오늘운"],
reply:[
"오늘 좋은 일이 생길지도 몰라요 🍀",
"행운이 함께하길 바랄게요 ✨"
]
}



];




// ===============================
// ❓ 모르는 말 랜덤 답변
// ===============================


const unknownReplies = [

"어라? 처음 듣는 말인데요? 😳\n하루가 아직 공부가 부족한가 봐요!",

"음... 그건 아직 잘 모르겠어요! 다시 한번 말해줄래요? 😊",

"찾아봤는데 해당되는 내용이 없어요 💙",

"아직 배운 내용이 아닌 것 같아요. 조금만 더 알려주세요!",

"으음... 무슨 말인지 잘 모르겠어요 🤔",

"제가 이해하지 못한 말이에요 😢",

"그건 제 목록에 없는 말이에요!",

"하루가 아직 모르는 단어예요! 업데이트가 필요해요 💙",

"어라? 처음 듣는 말인데요? 😳",

"죄송해요! 그 질문에 대한 답을 찾지 못했어요."

];

// ===============================
// 😈 장난 욕 반응
// ===============================


const angryReplies = [

"뭐야 😤 하루한테 왜 그래요!",

"어허 말 조심하세요 😠",

"하루 삐질 거예요 😤",

"갑자기 왜 화났어요? 😂",

"그런 말 하면 하루 속상해요 💙",

"하루가 기억해둘 거예요 👀",

"진정하세요~ 하루는 착한 봇이에요 😎"

];



const badWords = [

"시발",
"씨발",
"ㅅㅂ",
"개새끼",
"개새",
"병신",
"ㅂㅅ",
"장애",
"자폐",
"장애인",
"뒤질",
"닥쳐",
"꺼져",
"좆까"

];






// ===============================
// 💬 하루 대화 처리
// ===============================


client.on("messageCreate", async message => {


    if(message.author.bot)
        return;



    const msg = message.content;



    // 하루야 없으면 무시
    if(!msg.includes("하루야"))
        return;





    // ===============================
    // 😈 욕 감지
    // ===============================


    if(
        badWords.some(
            word => msg.includes(word)
        )
    ){


        const angry =

        angryReplies[
            Math.floor(
                Math.random() * angryReplies.length
            )
        ];


        return message.reply(angry);

    }





    // ===============================
    // 💙 대화 검색
    // ===============================


    for(const data of responses){


        if(
            data.keys.some(
                key => msg.includes(key)
            )
        ){


            const answer =

            data.reply[
                Math.floor(
                    Math.random() * data.reply.length
                )
            ];


            return message.reply(answer);


        }


    }





    // ===============================
    // ❓ 모르는 말
    // ===============================


    const unknown =

    unknownReplies[
        Math.floor(
            Math.random() * unknownReplies.length
        )
    ];


    return message.reply(unknown);



});






// ===============================
// 🚀 봇 실행
// ===============================


client.login(TOKEN);