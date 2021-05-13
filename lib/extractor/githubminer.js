const { Downloader } = require("./downloader");

const API_URL = "https://api.github.com/repos/";

class GitHubMiner{
    constructor(){
    }

    async getRepoData(repo){
        var url = API_URL + repo;
        var repoData = {
            hasTestDirectory:false
        };

        var data;
        try{
            data = await Downloader.download(url);
        } catch(e){
            return repoData;
        }

        data =JSON.parse(data);
        var contentsURL = data["contents_url"].split("{")[0];
        var contentsData = await this.analyzeContents(contentsURL);
        repoData.hasTestDirectory = contentsData.hasTestDirectory;

        return repoData;
    }

    async analyzeContents(contentsURL){
        var contentsData = {
            hasTestDirectory: false,
        }

        var data;
        try{
            data = await Downloader.download(contentsURL);
        } catch(e){
            return;
        }
        data =JSON.parse(data);
        for(var k of Object.keys(data)){
            var file = data[k];
            var type = file.type;
            if(type === "dir"){
                if(file.name === "test" || file.name === "tests"){
                    contentsData.hasTestDirectory = true;
                }
            }
        }

        return contentsData;
    }
}

// var g = new GitHubMiner();
// var data = g.getRepoData("Brittany-Reid/npm-code-snippets").then((data)=>{
//     console.log(data);
// });

module.exports = GitHubMiner;