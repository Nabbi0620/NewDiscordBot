const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1530511828025872394";
const GUILD_ID = "1451481873229283500";


// 레벨 저장
const LEVEL_FILE = "./levels.json";

let levels = {};

if(fs.existsSync(LEVEL_FILE)){
    levels = JSON.parse(
        fs.readFileSync(LEVEL_FILE)
    );
}

function saveLevels(){
    fs.writeFileSync(
        LEVEL_FILE,
        JSON.stringify(levels,null,2)
    );
}


// 봇 생성
const client = new Client({

    intents:[
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]

});



// 명령어 목록
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
    .setDescription("내 레벨 확인"),


    new SlashCommandBuilder()
    .setName("청소")
    .setDescription("메시지 삭제")
    .addIntegerOption(option =>
        option
        .setName("개수")
        .setDescription("삭제할 메시지 개수")
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

    }catch(err){

        console.log(err);

    }

})();



// 로그인

client.once("ready",()=>{

    console.log(
        `${client.user.tag} 로그인 완료!`
    );

});



// 채팅 레벨

client.on("messageCreate", message=>{


    if(message.author.bot)
        return;


    let id = message.author.id;


    if(!levels[id]){

        levels[id] = {

            name:message.author.username,
            count:0,
            level:0

        };

    }


    levels[id].count++;

    levels[id].level =
        Math.floor(
            levels[id].count / 100
        );


    levels[id].name =
        message.author.username;


    saveLevels();


});

// 명령어 처리

client.on("interactionCreate", async interaction=>{

    if(!interaction.isChatInputCommand())
        return;


    // 핑

    if(interaction.commandName==="핑"){

        await interaction.reply({

            content:
            `🏓 퐁!\n`+
            `🤖 봇 상태: 정상 작동\n`+
            `📡 서버 핑: ${client.ws.ping}ms`

        });

    }



    // DM

    if(interaction.commandName==="dm"){

        await interaction.deferReply({
            ephemeral:true
        });


        const user =
        interaction.options.getUser("유저");


        const content =
        interaction.options.getString("내용");


        try{

            await user.send(content);


            await interaction.editReply(
                "✅ DM 전송 완료!"
            );


        }catch(error){

            await interaction.editReply(
                "❌ DM 전송 실패"
            );

        }

    }



    // 주사위

    if(interaction.commandName==="주사위"){

        const num =
        Math.floor(Math.random()*6)+1;


        await interaction.reply(
            `🎲 결과: **${num}**`
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


        if(user===bot){

            result="🤝 무승부!";

        }
        else if(

            (user==="가위"&&bot==="보") ||
            (user==="바위"&&bot==="가위") ||
            (user==="보"&&bot==="바위")

        ){

            result="🎉 승리!";

        }
        else{

            result="😢 패배!";

        }


        await interaction.reply(

            `🎮 가위바위보\n\n`+
            `👤 너: ${user}\n`+
            `🤖 봇: ${bot}\n\n`+
            result

        );

    }




    // 채팅 정보

    if(interaction.commandName==="채팅정보"){


        const id =
        interaction.user.id;


        if(!levels[id]){

            levels[id]={
                name:interaction.user.username,
                count:0,
                level:0
            };

            saveLevels();

        }


        const data =
        levels[id];


        const next =
        100-(data.count%100);



        await interaction.reply(

            `📊 ${interaction.user.username}님의 정보\n\n`+
            `⭐ 레벨: **${data.level}**\n`+
            `💬 채팅 수: **${data.count}개**\n`+
            `⬆️ 다음 레벨까지: **${next}개**`

        );

    }





    // 청소 (관리자만)

if(interaction.commandName==="청소"){

    if(!interaction.member.permissions.has(
        PermissionFlagsBits.ManageMessages
    )){
        return interaction.reply({
            content:"❌ 메시지 관리 권한이 필요합니다.",
            ephemeral:true
        });
    }


    const amount = interaction.options.getInteger("개수");


    if(amount < 1 || amount > 100){

        return interaction.reply({
            content:"❌ 1~100 사이 숫자만 가능합니다.",
            ephemeral:true
        });

    }


    await interaction.deferReply({
        ephemeral:true
    });


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

        console.error("청소 오류:", error);


        await interaction.editReply(
            "❌ 메시지를 삭제하지 못했습니다."
        );

    }

}


});

const http = require("http");

http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Bot is running!");
}).listen(process.env.PORT || 3000);

// 봇 실행

client.login(TOKEN);