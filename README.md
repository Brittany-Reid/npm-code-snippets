# npm-code-snippets

Extract code snippets from NPM package documentation.

## Usage

### Node.js

Get code snippets for a given package name:

```js
const snippets = require("npm-code-snippets");

snippets.get("express").then(function(result){
	console.log(result);
});
```

 ## Install
 
 ```sh
 npm install
 ```

 Currently not published on NPM.

## API

### get(name: string): Promise < String[] >

For a given NPM package name, downloads the README and returns an array of extracted code snippets.


```js
const snippets = require("npm-code-snippets");

snippets.get("express").then(function(result){
	console.log(result);
});
```

### Downloader

The downloader class includes functionality to download package READMEs from online.

Package data from the NPM registry looks like this (simplified):

```json
{
    "name" : "package",
    "readme" : "...",
    "readmeFilename" : "README.md",
    "repository" : {
        "url" : "https://giithub.com/..."
    },
    "versions" : {
        "0.0.1" : {
            "readme" : "...",
            "readmeFIlename" : "README.md",
        },
    }
}
```

The downloader follows the following process:

1. Download the registry data for a package
2. Try to download the README from the repository `url` field.
    - If the `readmeFilename` isn't empty, use this to locate the URL.
    - Otherwise, look for the most recent `readmeFilename` in the `versions` field.
    - If still none, bruteforce using a set of common readme names.
3. Fallback to the `readme` field in the registry data.
4. If the `readme` field is empty, look for the most recent `readme` in the `versions` field. Sometimes the `readme` field will be empty despite there being a README available on the NPM website.

The `examples/miner.js` example shows how `Downloader` can be used to mine the NPM registry, while preserving errors that may be useful for statistic purposes.

#### new Downloader(options: {})

Constructs a new Downloader instance, taking an optional options object as argument.

```js
const { Downloader } = require("npm-code-snippets");

var downloader = new Downloader();
```

**Options**

|Option|Type|Description|
|-|-|-|
|`registry`|`string`|Registry URL to download package data from.
|`filenames`|`string[]`|Array of string filenames to try on GitHub.

#### getReadme(name: string): Promise < string >

Async function to download the README of an NPM package.

```js
const { Downloader } = require("npm-code-snippets");

var downloader = new Downloader();
downloader.getReadme("npm-code-snippets").then(function(result){
    console.log(result);
});
```

### Extractor

The extractor class includes functionality to extract code snippets from markdown, including options that help filter out non node.js code. 

By default, Extractor looks at the langauge flags used for syntax highlighting, for example:

````
```node
console.log("test");
```
````

And filters out code marked with non-node or javascript tags.

#### new Extractor(options: {})
Construct a new instance of Extractor.


## Contributing

//TODO

### Tests

NCS uses mocha and nyc for testing.

You can run the mocha test cases using:

```sh
npm run test
```

You can also run the nyc coverage using:

```sh 
npm run coverage
```

## See More

- The code in NCS was originally used to extract code snippets for [node_code_query](https://github.com/damorimRG/node_code_query), a REPL environment with integrated code search. 



<!-- 

## Install the CLI Application

To use the CLI command `npm-code-snippets` you will need to install the package globally.

```sh
npm install -g 
```

## Usage

### CLI:
```sh
npm-code-snippets [options] <package> 
```

## Node.js:
```node
//TODO
```
#
## API

### get(name : string, options : object) : Array

Given a package name, download and extract code snippets for that package. Returns an array of strings.

```node
//TODO
```

### extract(contents : string, options : object) : Array

Given a string of markdown, extract code snippets. Returns an array of strings.

```node
//TODO
```

-->
