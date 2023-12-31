# llmbinge

![Screenshot](docs/llmbinge.png)

This is a simple web-app to explore ideas based on LLM, with very little typing.
The basic idea is to use LLM to generate a response and also a set of suggestions for each response.
We can click on those suggestions to explore the topic further.

Currently [ollama](https://github.com/jmorganca/ollama) is the only supported backend.

## Features
1. Generation of response from queries (basic)
2. Generation of related queries and suggestions
3. Generation based on text selection
4. History management
5. Parent-child relation management for topics
6. Handling a set of aspects for every response (eg: people, places, etc)

## Development
Use the following commands to get the app running in dev mode:

```bash
https://github.com/charstorm/llmbinge.git
cd llmbinge/llmbinge
yarn install
yarn dev
```

## TODO

- [x] configuration for model and url
- [x] configuration for output size
- [x] favicon for the app
- [x] generation of "random" topics
- [ ] support response regeneration
- [ ] support save and reload
- [ ] markdown code rendering
- [ ] equation rendering
- [ ] graphviz graph rendering
- [ ] detailed instructions on setting up the project
- [ ] release 1.0
