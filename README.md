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

compile to javascript:
```bash
tsc
```

## running

chrome: requires some basic http server otherwise chrome doesnt allow loading images

firefox: no http server required, just open index.html
