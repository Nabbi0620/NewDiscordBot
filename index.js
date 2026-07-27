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
// 💙 하루봇 대화 시스템
// ===============================


const responses = [

{
keys:["안녕","ㅎㅇ","하이","반가워"],
reply:[
"안녕하세요! 하루가 기다리고 있었어요 💙",
"어서와요 😊 오늘 하루는 어땠어요?",
"반가워요! 같이 이야기해요!"
]
},


{
keys:["뭐해","머해","하고있어"],
reply:[
"하루는 여러분과 이야기하고 있어요 💙",
"항상 여기서 기다리고 있었어요 😊",
"여러분을 만나는 중이에요!"
]
},


{
keys:["게임","롤","배그","로블록스","스팀"],
reply:[
"게임 좋아하는군요! 🎮",
"친구들과 하는 게임은 더 재밌어요!",
"재밌는 게임 찾아볼까요? 😆"
]
},


{
keys:["음악","노래","노래추천"],
reply:[
"좋아하는 노래 장르가 있나요? 🎵",
"음악은 기분을 바꿔줘요 💙",
"플레이리스트 만들어볼까요?"
]
},


{
keys:["영화","무비","볼만한"],
reply:[
"재밌는 영화 찾아볼까요? 🎬",
"액션 영화 좋아해요?",
"주말에 영화 한 편 어때요?"
]
},


{
keys:["애니","애니메이션"],
reply:[
"애니 좋아하는군요! ✨",
"좋아하는 작품이 있나요?",
"하루도 애니 이야기 좋아해요!"
]
},


{
keys:["밥","음식","메뉴","배고파"],
reply:[
"맛있는 거 먹어요 🍗",
"치킨은 언제나 좋아요 😆",
"따뜻한 음식 추천해드릴게요!"
]
},


{
keys:["공부","시험","숙제"],
reply:[
"조금씩 하면 충분해요 📚",
"하루가 응원할게요 💙",
"힘내요! 할 수 있어요 😊"
]
},


{
keys:["졸려","잠","잘자"],
reply:[
"푹 쉬어요 🌙",
"좋은 꿈 꿔요 💙",
"오늘도 고생 많았어요!"
]
},


{
keys:["심심","할거없"],
reply:[
"하루랑 이야기해요 😆",
"같이 놀까요? 💙",
"재밌는 이야기 해봐요!"
]
},


{
keys:["사랑해"],
reply:[
"고마워요 💙",
"따뜻한 말 고마워요 😊",
"하루 기분 좋아졌어요!"
]
},


{
keys:["귀여워"],
reply:[
"고마워요 😊",
"더 귀여운 하루가 될게요 💙"
]
},


{
keys:["고마워","감사"],
reply:[
"별말씀을요 😊",
"언제든 불러주세요 💙"
]
},


{
keys:["누구","정체"],
reply:[
"저는 하루예요! 여러분과 이야기하는 봇이에요 💙"
]
},


{
keys:["힘내","화이팅","응원"],
reply:[
"하루가 응원할게요 💙",
"분명 잘하고 있어요!",
"힘내요 😊"
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