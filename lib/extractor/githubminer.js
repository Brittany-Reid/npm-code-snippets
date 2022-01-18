const { Downloader, HTTPStatusError } = require("./downloader");

const API_URL = "https://api.github.com/repos/";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

class GitHubMiner{
    constructor(){
        this.tokens = [];
        //this.tokens = [""];
        this.token = 0;
    }

    static getRepo(url){
        if(url.includes("github.com:")) url = url.replace("github.com:", "github.com/");
		if(url.includes("github.com/")){
            var repo = url.split("github.com/")[1];
            var parts = repo.split("/");
            var user = parts[0];
            var name = parts[1];

            repo = user + "/" + name;
            
            //remove .git from end if exists
            if(repo.endsWith(".git")){
                repo = repo.replace(".git", "");
            }

            return repo;
		}
    }

    nextToken(){
        this.token++;
        if(this.token >= this.tokens.length) this.token=0;
    }


    async downloadGitHub(url, swap = false){
        var data;
        try{
            data = await Downloader.download(url, this.tokens[this.token]);
        }catch(e){
            if((e instanceof HTTPStatusError) && e.statusCode === 403 && e.wait){
                console.log("ratelimit")
                throw e;
            }
            console.log(e)
        }
        // return new Promise(async (resolve, reject) => {
        //     var data;
        //     try{
        //         data = await Downloader.download(url, this.tokens[this.token]);
        //     } catch(e){
        //         if((e instanceof HTTPStatusError) && e.statusCode === 404){
        //             resolve(undefined);
        //             return;
        //         }
        //         if((e instanceof HTTPStatusError) && e.statusCode === 403 && e.wait){
        //             var wait = e.wait;
        //             if(!swap) {
        //                 this.token++;
        //                 if(this.token >= this.tokens.length) this.token = 0;
        //                 resolve(await this.downloadGitHub(url, true));
        //             }
        //             else{
        //                 console.log("waiting for" + wait);
        //                 await delay(wait);
        //                 resolve(await this.downloadGitHub(url));
        //             }
        //         }
        //         console.log(e)
        //         resolve(undefined);
        //     }
        //     resolve(data);
        // })
        return data;
    }

    async getRepoData(repo){
        var repoData = {
            stars: 0,
            fork: false,
            forks: 0,
            watchers: 0,
            hasTestDirectory:false
        };
        if(!repo){
            return repoData;
        }

        var url = API_URL + repo;
        var data;
        data = await this.downloadGitHub(url);
        if(!data) return repoData;
        data = JSON.parse(data);
        repoData.stars = data["stargazers_count"];
        repoData.watchers = data["subscribers_count"];
        repoData.fork = data["fork"];
        repoData.forks = data["forks"];
        var contentsURL = data["contents_url"].split("{")[0];
        var contentsData = await this.analyzeContents(contentsURL);
        repoData.hasTestDirectory = contentsData.hasTestDirectory;

        return repoData;

        //github has rate limits :(

        // var data;
        // try{
        //     var url = API_URL + repo;
        //     data = await Downloader.download(url);
        // } catch(e){
        //     return repoData;
        // }

        // data =JSON.parse(data);
        // var contentsURL = data["contents_url"].split("{")[0];
        // var contentsData = await this.analyzeContents(contentsURL);
        // repoData.hasTestDirectory = contentsData.hasTestDirectory;
    }

    async analyzeContents(url){
        var contentsData = {
            hasTestDirectory: false,
        }

        var data;
        data = await this.downloadGitHub(url);
        if(!data) return contentsData
        data = JSON.parse(data);
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