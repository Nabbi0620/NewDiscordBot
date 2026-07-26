const fs = require("fs");

const FILE = "./levels.json";


if(!fs.existsSync(FILE)){
    fs.writeFileSync(FILE, "{}");
}


function load(){

    try{

        return JSON.parse(
            fs.readFileSync(FILE, "utf8")
        );

    }catch{

        return {};

    }

}


function save(data){

    fs.writeFileSync(
        FILE,
        JSON.stringify(data,null,2)
    );

}


module.exports = {


    get(id){

        const data = load();

        return data[id];

    },


    set(id,user){

        const data = load();

        data[id] = user;

        save(data);

    },


    getAll(){

        return load();

    }

};