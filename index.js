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



// 봇
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
.setName("dm")
.setDescription("DM 보내기")
.addUserOption(o=>
    o.setName("유저")
    .setDescription("보낼 사람")
    .setRequired(true)
)
.addStringOption(o=>
    o.setName("내용")
    .setDescription("내용")
    .setRequired(true)
),



new SlashCommandBuilder()
.setName("주사위")
.setDescription("주사위 굴리기"),



new SlashCommandBuilder()
.setName("가위바위보")
.setDescription("게임")
.addStringOption(o=>
    o.setName("선택")
    .setDescription("선택")
    .setRequired(true)
    .addChoices(
        {name:"가위",value:"가위"},
        {name:"바위",value:"바위"},
        {name:"보",value:"보"}
    )
),



new SlashCommandBuilder()
.setName("레벨정보")
.setDescription("레벨 확인"),



new SlashCommandBuilder()
.setName("레벨랭킹")
.setDescription("랭킹 확인"),



new SlashCommandBuilder()
.setName("핑")
.setDescription("봇 핑 확인"),



new SlashCommandBuilder()
.setName("상태")
.setDescription("봇 상태 확인"),



new SlashCommandBuilder()
.setName("청소")
.setDescription("메시지 삭제")
.addIntegerOption(o=>
    o.setName("개수")
    .setDescription("삭제할 개수")
    .setRequired(true)
)


].map(x=>x.toJSON());





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

}

catch(err){

console.log(err);

}


})();






// 로그인

client.once("ready",()=>{

console.log(
`${client.user.tag} 로그인 완료!`
);

});






// 레벨 시스템

client.on("messageCreate",message=>{


if(message.author.bot)
return;


let id = message.author.id;



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
levels[id].count/100
);



levels[id].name =
message.author.username;



saveLevels();


});







// 명령어 처리

client.on(
"interactionCreate",
async interaction=>{


if(!interaction.isChatInputCommand())
return;



// DM

if(interaction.commandName==="dm"){


let user =
interaction.options.getUser("유저");


let text =
interaction.options.getString("내용");


try{

await user.send(text);


await interaction.reply({

content:"✅ DM 전송 완료",

ephemeral:true

});


}

catch{

await interaction.reply({

content:"❌ DM 실패",

ephemeral:true

});

}


}







// 주사위

if(interaction.commandName==="주사위"){


let dice =
Math.floor(Math.random()*6)+1;


await interaction.reply(
`🎲 결과 : ${dice}`
);


}







// 가위바위보

if(interaction.commandName==="가위바위보"){


let user =
interaction.options.getString("선택");


let list=[
"가위",
"바위",
"보"
];


let bot =
list[Math.floor(Math.random()*3)];


let result;


if(user===bot)

result="🤝 무승부";


else if(

(user==="가위"&&bot==="보")||

(user==="바위"&&bot==="가위")||

(user==="보"&&bot==="바위")

)

result="🎉 승리";


else

result="😢 패배";



await interaction.reply(

`👤 ${user}\n🤖 ${bot}\n\n${result}`

);


}







// 레벨정보

if(interaction.commandName==="레벨정보"){


let id =
interaction.user.id;



if(!levels[id]){

levels[id]={
name:interaction.user.username,
count:0,
level:0
};

}


let data=levels[id];


await interaction.reply(

`⭐ 레벨 : ${data.level}\n`+
`💬 채팅 : ${data.count}개\n`+
`⬆️ 다음 레벨 : ${100-(data.count%100)}개`

);


}








// 랭킹

if(interaction.commandName==="레벨랭킹"){


let rank =
Object.values(levels)
.sort(
(a,b)=>
b.level-a.level ||
b.count-a.count
)
.slice(0,10);



let msg="🏆 랭킹\n\n";


rank.forEach((u,i)=>{

msg+=
`${i+1}위 ${u.name} Lv.${u.level} (${u.count})\n`;

});


await interaction.reply(msg);


}







// 핑

if(interaction.commandName==="핑"){


await interaction.reply(

`🏓 퐁!\n📡 ${client.ws.ping}ms`

);


}







// 상태

if(interaction.commandName==="상태"){


await interaction.reply(

`✅ 온라인\n🤖 ${client.user.tag}\n📡 ${client.ws.ping}ms`

);


}







// 청소

if(interaction.commandName==="청소"){


let amount =
interaction.options.getInteger("개수");



if(amount<1 || amount>100){

return interaction.reply({

content:"1~100만 가능",

ephemeral:true

});

}



let messages =
await interaction.channel.messages.fetch({

limit:amount

});



await interaction.channel.bulkDelete(
messages,
true
);



await interaction.reply({

content:`🧹 ${amount}개 삭제 완료`,

ephemeral:true

});


}



}

);





client.login(TOKEN);