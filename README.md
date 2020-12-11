# npm-code-snippets
Extract code snippets from NPM package documentation.

API for extracting code snippets from NPM package documentation. 

Features:

- Download and extract code snippets from NPM package README files just using a package name.
- Extract code snippets from markdown files and strings.

 ## Install
 
 ```sh
 npm install
 ```

 Currently not published on NPM.

## Install the CLI Application

To use the CLI command `npm-code-snippets` you will need to install the package globally.

```sh
npm install -g 
```

## Usage

### CLI:
```sh
npm-code-snoppets [options] <package> 
```

### Node.js:
```node
//TODO
```

## API

### extract(content : string, options : object)

Extract code snippets from a markdown string.

TODO

### extractForName(name : string, options : object)

Extract code snippets given a package name, using the NPM registry to fetch the package's README.

TODO

### Options

| Option | Type | Description |
| - | - | - |
| `langauge` | Array [] | Array of markdown syntax highlighting languages to allow. |

Example:

```node
options = {
    languages: ["node", "js", "sh"]
}
```

