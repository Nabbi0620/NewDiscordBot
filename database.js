const fs = require("fs");

const file = "./levels.json";

if(!fs.existsSync(file)){
    fs.writeFileSync(file, "{}");
}

let levels = JSON.parse(
    fs.readFileSync(file, "utf8")
);


function save(){
    fs.writeFileSync(
        file,
        JSON.stringify(levels,null,2)
    );
}


module.exports = {

    get(id){
        return levels[id];
    },


    set(id,data){
        levels[id]=data;
        save();
    },


    all(){
        return Object.values(levels);
    }

};