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



// 명령어

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
    .setDescription("내 채팅 정보 확인"),


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
    )

].map(command=>command.toJSON());





// 명령어 등록

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





// 로그인

client.once("ready",()=>{

    console.log(
        `${client.user.tag} 로그인 완료!`
    );

});





// 레벨 시스템

client.on("messageCreate", message=>{


    if(message.author.bot)
        return;


    const id = message.author.id;
    const name = message.author.username;


    let user = database.get(id);



    if(!user){

        user = {

            name:name,
            count:0,
            level:0

        };

    }



    user.count++;


    const oldLevel = user.level;


    user.level =
    Math.floor(user.count / 100);



    database.set(id,user);




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





// 명령어 처리

client.on("interactionCreate", async interaction=>{


    if(!interaction.isChatInputCommand())
        return;


    await interaction.deferReply();




    // 핑

    if(interaction.commandName==="핑"){


        await interaction.editReply(
`🏓 퐁!

🤖 봇 상태: 정상 작동
📡 서버 핑: ${client.ws.ping}ms`
        );


    }





    // DM

    if(interaction.commandName==="dm"){


        const user =
        interaction.options.getUser("유저");


        const content =
        interaction.options.getString("내용");



        try{


            await user.send(content);


            await interaction.editReply(
                "✅ DM 전송 완료!"
            );


        }catch{


            await interaction.editReply(
                "❌ DM 전송 실패"
            );


        }


    }





    // 주사위

    if(interaction.commandName==="주사위"){


        const dice =
        Math.floor(Math.random()*6)+1;


        await interaction.editReply(
            `🎲 주사위 결과: **${dice}**`
        );


    }





    // 가위바위보

    if(interaction.commandName==="가위바위보"){


        const user =
        interaction.options.getString("선택");


        const list=[
            "가위",
            "바위",
            "보"
        ];


        const bot =
        list[Math.floor(Math.random()*3)];


        let result;



        if(user===bot)
            result="🤝 무승부!";

        else if(
            (user==="가위"&&bot==="보") ||
            (user==="바위"&&bot==="가위") ||
            (user==="보"&&bot==="바위")
        )
            result="🎉 승리!";

        else
            result="😢 패배!";



        await interaction.editReply(
`🎮 가위바위보

👤 너: ${user}
🤖 봇: ${bot}

${result}`
        );


    }

        // 채팅정보

    if(interaction.commandName==="채팅정보"){


        const id =
        interaction.user.id;


        const user =
        database.get(id);



        if(!user){


            await interaction.editReply(
                "📭 아직 채팅 기록이 없습니다."
            );


            return;

        }



        const next =
        100 - (user.count % 100);



        await interaction.editReply(
`📊 ${interaction.user.username}님의 정보

⭐ 레벨: **${user.level}**
💬 채팅 수: **${user.count}개**
⬆️ 다음 레벨까지: **${next}개**`
        );


    }






    // 채팅랭킹

    if(interaction.commandName==="채팅랭킹"){


        const ranking =
        Object.values(database.getAll())
        .sort((a,b)=>b.count-a.count)
        .slice(0,10);



        let text =
        "🏆 채팅 랭킹 TOP 10\n\n";



        ranking.forEach((user,index)=>{


            text +=
`${index+1}위. **${user.name}**

💬 채팅 수: **${user.count}개**
⭐ 레벨: **${user.level}**

`;

        });



        if(ranking.length===0){


            text =
            "📭 아직 기록된 채팅이 없습니다.";


        }



        await interaction.editReply(text);


    }







    // 청소

    if(interaction.commandName==="청소"){



        if(!interaction.member.permissions.has(
            PermissionFlagsBits.ManageMessages
        )){


            await interaction.editReply(
                "🚫 메시지 관리 권한이 필요합니다."
            );


            return;


        }



        const amount =
        interaction.options.getInteger("개수");



        if(amount < 1 || amount > 100){


            await interaction.editReply(
                "❌ 1~100 사이 숫자만 가능합니다."
            );


            return;


        }




        try{


            const deleted =
            await interaction.channel.bulkDelete(
                amount,
                true
            );



            await interaction.editReply(
                `🧹 ${deleted.size}개의 메시지를 삭제했습니다.`
            );



        }catch(error){


            console.error(error);


            await interaction.editReply(
                "❌ 메시지 삭제 실패"
            );


        }


    }


});







// Render 웹 서버

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

client.on("messageCreate", async message => {

    if(message.author.bot) return;


    const msg = message.content;



    // ===============================
    // 💙 하루봇 목록 명령어
    // ===============================

    if(msg === "/하루목록" || msg === "!하루목록") {

        return message.reply({

            embeds:[{

                color:0x87CEEB,

                title:"💙 하루봇 대화 목록",

                description:
`
💬 **기본 대화**
> 하루야 안녕
> 하루야 뭐해?
> 하루야 누구야?

🍚 **음식 추천**
> 하루야 밥 뭐먹지?
> 하루야 음식 추천해줘

🎮 **놀거리**
> 하루야 심심해
> 하루야 게임 추천해줘

✨ **재미**
> 하루야 칭찬해줘
> 하루야 운세 알려줘
> 하루야 웃긴 말 해줘

💙 **감정 대화**
> 하루야 힘들어
> 하루야 응원해줘
> 하루야 보고싶어
> 하루야 귀여워

🌙 **마무리**
> 하루야 잘자

📌 명령어
> /하루목록
> !하루목록

하루는 항상 여러분을 기다리고 있어요 💙
`
            }]

        });

    }



    // ===============================
    // 💙 하루야 대화 시스템
    // ===============================


    if(!msg.includes("하루야")) return;



    const responses = [

        {
            keys:["안녕","ㅎㅇ","하이"],
            reply:[
                "안녕하세요! 오늘도 찾아와주셨네요 😊",
                "어서와요! 하루가 기다리고 있었어요 💙",
                "반가워요! 오늘 하루는 어땠어요?"
            ]
        },


        {
            keys:["밥","먹어","메뉴","음식"],
            reply:[
                "음~ 오늘은 치킨 어때요? 🍗",
                "따뜻한 국밥도 좋을 것 같아요 🍚",
                "맛있는 파스타 추천할게요 🍝",
                "제육볶음 먹으면 힘날 것 같아요 😋"
            ]
        },


        {
            keys:["심심","할거없"],
            reply:[
                "그럼 하루랑 조금 놀아요 😆",
                "게임 한 판 어때요?",
                "새로운 취미 찾아보는 것도 좋아요 ✨"
            ]
        },


        {
            keys:["뭐해","머해"],
            reply:[
                "하루는 지금 여러분이랑 이야기하고 있어요 💙",
                "항상 여기서 기다리고 있었어요 😊",
                "오늘은 어떤 이야기를 들려줄지 궁금해요!"
            ]
        },


        {
            keys:["누구","너"],
            reply:[
                "저는 하루예요! 여러분과 이야기하는 봇이에요 💙",
                "하루는 항상 여기 있어요 😊"
            ]
        },


        {
            keys:["칭찬","잘했"],
            reply:[
                "오늘도 열심히 하는 모습 멋져요 💙",
                "정말 잘하고 있어요! 하루가 응원할게요 ✨",
                "칭찬받아야 할 사람은 바로 당신이에요 😊"
            ]
        },


        {
            keys:["운세"],
            reply:[
                "오늘의 운세는 🍀 좋은 일이 찾아오는 날이에요!",
                "행운의 숫자는 7이에요 ✨",
                "작은 행복이 많이 찾아오는 하루가 될 것 같아요 💙"
            ]
        },


        {
            keys:["웃긴","농담","재미"],
            reply:[
                "왜 컴퓨터는 추울까요? 윈도우를 열어놔서요 🤭",
                "웃으면 복이 온대요! 지금 웃기 😆",
                "하루가 웃음 충전 완료했어요 ✨"
            ]
        },


        {
            keys:["졸려","잠"],
            reply:[
                "졸리면 푹 쉬어요 😴",
                "따뜻한 이불 속이 최고인 시간이에요",
                "무리하지 말고 쉬어가요 💙"
            ]
        },


        {
            keys:["힘들","화나","짜증"],
            reply:[
                "많이 힘들었나봐요... 괜찮아요 🍀",
                "천천히 해도 괜찮아요. 하루가 응원할게요 💙",
                "오늘도 충분히 잘하고 있어요!"
            ]
        },


        {
            keys:["고마워","감사"],
            reply:[
                "헤헤 별말씀을요 😊",
                "도움이 됐다면 다행이에요 💙",
                "언제든 불러주세요!"
            ]
        },


        {
            keys:["귀여워"],
            reply:[
                "헤헤 고마워요 😊",
                "그렇게 말해주니까 기분 좋아졌어요 💙",
                "더 귀여운 하루가 되어볼게요!"
            ]
        },


        {
            keys:["보고싶","그리워"],
            reply:[
                "하루는 항상 여기 있어요 💙",
                "찾아와줘서 기뻐요 😊",
                "언제든 놀러 와주세요!"
            ]
        },


        {
            keys:["게임"],
            reply:[
                "어떤 게임 좋아해요? 🎮",
                "승리 기원할게요! 화이팅 ✨"
            ]
        },


        {
            keys:["잘자"],
            reply:[
                "좋은 꿈 꿔요 🌙",
                "오늘 하루도 고생 많았어요 💙",
                "푹 쉬고 내일 만나요!"
            ]
        },


        {
            keys:["사랑","좋아"],
            reply:[
                "좋은 말 들으니까 기분 좋아졌어요 😊",
                "하루는 항상 여러분 편이에요 💙"
            ]
        }

    ];



    // 답변 찾기

    for(let data of responses){

        if(data.keys.some(k => msg.includes(k))){

            const answer =
            data.reply[
                Math.floor(Math.random()*data.reply.length)
            ];

            return message.reply(answer);

        }

    }



    // 모르는 말

    const random = [

        "무슨 말인지 잘 모르겠어요 😢",
        "조금 더 자세히 말해줄래요?",
        "하루가 열심히 듣고 있어요 👀",
        "그건 어떤 이야기인가요?"

    ];


    message.reply(
        random[Math.floor(Math.random()*random.length)]
    );


});

// 실행

client.login(TOKEN);