# procedural tree

## building

download [webglmath](https://github.com/szecsi/WebGLMath) as a submodule:
```bash
git submodule update --recursive --remote
```

you will need to have typescript installed:
```bash
npm install -g typescript
```

download dependencies:
```
npm install
```

compile to javascript:
```bash
tsc
```

## running

Chrome: requires some basic http server otherwise Chrome doesnt allow loading images

Firefox: no http server required, just open index.html
