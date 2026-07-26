const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder 
} = require("discord.js");

const fs = require("fs");


const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1530511828025872394";
const GUILD_ID = "1451481873229283500";


// 레벨 데이터
const LEVEL_FILE = "./levels.json";

let levels = {};

if (fs.existsSync(LEVEL_FILE)) {
    levels = JSON.parse(fs.readFileSync(LEVEL_FILE));
}

function saveLevels() {
    fs.writeFileSync(
        LEVEL_FILE,
        JSON.stringify(levels, null, 2)
    );
}



const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});



// 슬래시 명령어
const commands = [

    new SlashCommandBuilder()
        .setName("dm")
        .setDescription("유저에게 DM을 보냅니다")
        .addUserOption(option =>
            option
            .setName("유저")
            .setDescription("DM 보낼 유저")
            .setRequired(true)
        )
        .addStringOption(option =>
            option
            .setName("내용")
            .setDescription("보낼 내용")
            .setRequired(true)
        ),


    new SlashCommandBuilder()
        .setName("주사위")
        .setDescription("주사위를 굴립니다."),



    new SlashCommandBuilder()
        .setName("가위바위보")
        .setDescription("봇과 가위바위보")
        .addStringOption(option =>
            option
            .setName("선택")
            .setDescription("가위 바위 보")
            .setRequired(true)
            .addChoices(
                {name:"✌️ 가위",value:"가위"},
                {name:"✊ 바위",value:"바위"},
                {name:"🖐️ 보",value:"보"}
            )
        ),



    new SlashCommandBuilder()
        .setName("레벨정보")
        .setDescription("내 레벨 정보를 확인합니다."),



    new SlashCommandBuilder()
        .setName("레벨랭킹")
        .setDescription("레벨 랭킹을 확인합니다.")

].map(command => command.toJSON());



const rest = new REST({version:"10"}).setToken(TOKEN);



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




// 봇 로그인
client.once("ready",()=>{

    console.log(
        `${client.user.tag} 로그인 완료!`
    );

});




// 채팅 레벨 시스템
client.on("messageCreate", message=>{


    if(message.author.bot) return;


    const id = message.author.id;


    if(!levels[id]){

        levels[id]={
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





// 슬래시 명령어 처리
client.on("interactionCreate", async interaction=>{


    if(!interaction.isChatInputCommand())
        return;



    // DM
    if(interaction.commandName==="dm"){


        const user =
            interaction.options.getUser("유저");


        const content =
            interaction.options.getString("내용");


        try{


            await user.send(content);


            await interaction.reply({

                content:"✅ DM 전송 완료!",
                ephemeral:true

            });


        }catch{


            await interaction.reply({

                content:"❌ DM 전송 실패",
                ephemeral:true

            });

        }

    }





    // 주사위
    if(interaction.commandName==="주사위"){


        const dice =
            Math.floor(Math.random()*6)+1;


        await interaction.reply(
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


        if(user===bot){

            result="🤝 무승부!";

        }
        else if(
            (user==="가위"&&bot==="보")||
            (user==="바위"&&bot==="가위")||
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
            `${result}`

        );

    }





    // 레벨 정보
    if(interaction.commandName==="레벨정보"){


        const id =
            interaction.user.id;


        if(!levels[id]){

            levels[id]={
                name:interaction.user.username,
                count:0,
                level:0
            };

        }


        const data=levels[id];


        const next =
            100-(data.count%100);



        await interaction.reply(

            `📊 ${interaction.user.username}님의 레벨\n\n`+
            `⭐ 레벨: **${data.level}**\n`+
            `💬 채팅 수: **${data.count}개**\n`+
            `⬆️ 다음 레벨까지: **${next}개**`

        );

    }





    // 레벨 랭킹
    if(interaction.commandName==="레벨랭킹"){


        const ranking =
            Object.values(levels)
            .sort(
                (a,b)=>
                b.level-a.level ||
                b.count-a.count
            )
            .slice(0,10);



        let text="🏆 레벨 랭킹\n\n";


        ranking.forEach((user,index)=>{

            text +=
            `${index+1}위. **${user.name}**\n`+
            `⭐ Lv.${user.level} | 💬 ${user.count}개\n\n`;

        });



        await interaction.reply(text);

    }


});



client.login(TOKEN);