# npm-code-snippets
Extract code snippets from NPM package documentation.

In Progress!

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
npm-code-snippets [options] <package> 
```

### Node.js:
```node
//TODO
```

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
