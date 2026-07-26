const db = require("./database");
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



// 채팅 레벨 시스템

client.on("messageCreate", message=>{

    if(message.author.bot) return;


    const id = message.author.id;
    const name = message.author.username;


    db.get(
        "SELECT * FROM levels WHERE id=?",
        [id],
        (err,row)=>{


            if(!row){

                db.run(
                    "INSERT INTO levels VALUES (?,?,?,?)",
                    [
                        id,
                        name,
                        1,
                        0
                    ]
                );

            }

            else{


                const count = row.count + 1;
                const level = Math.floor(count / 100);


                db.run(
                    `
                    UPDATE levels
                    SET name=?, count=?, level=?
                    WHERE id=?
                    `,
                    [
                        name,
                        count,
                        level,
                        id
                    ]
                );


                if(level > row.level){

                    message.channel.send(
`╔═════════════════╗
🎉 레벨 업!
👤 ${name}
⭐ Lv.${level}
╚═════════════════╝`
                    );

                }

            }

        }
    );

});

// 명령어 처리

client.on("interactionCreate", async interaction=>{

    if(!interaction.isChatInputCommand())
        return;


    await interaction.deferReply();



    // 핑

    if(interaction.commandName==="핑"){

        await interaction.editReply(
            `🏓 퐁!\n`+
            `🤖 봇 상태: 정상 작동\n`+
            `📡 서버 핑: ${client.ws.ping}ms`
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


        db.get(
            "SELECT * FROM levels WHERE id=?",
            [id],
            async(err,row)=>{


                if(!row){

                    await interaction.editReply(
                        "📭 아직 채팅 기록이 없습니다."
                    );

                    return;

                }


                const next =
                100-(row.count%100);


                await interaction.editReply(

`📊 ${interaction.user.username}님의 정보

⭐ 레벨: **${row.level}**
💬 채팅 수: **${row.count}개**
⬆️ 다음 레벨까지: **${next}개**`

                );


            }
        );


    }



    // 채팅랭킹

    if(interaction.commandName==="채팅랭킹"){


        db.all(
            "SELECT * FROM levels ORDER BY count DESC LIMIT 10",
            [],
            async(err,ranking)=>{


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
        );


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



// Render용 웹 서버

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



// 실행

client.login(TOKEN);