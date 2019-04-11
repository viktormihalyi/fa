class Texture2D {
    public mediaFileUrl: string;
    public glTexture: WebGLTexture;
    public image: HTMLImageElement;

    constructor(gl: WebGL2RenderingContext, mediaFileUrl: string) {
        App.pendingResources[mediaFileUrl] = ++App.pendingResources[mediaFileUrl] || 1;
        this.mediaFileUrl = mediaFileUrl;
        this.glTexture = gl.createTexture()!;
        this.image = new Image();
        this.image.onload = () => this.loaded(gl);
        this.image.src = mediaFileUrl;
    }
    loaded(gl: WebGL2RenderingContext) {
        gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        if (--App.pendingResources[this.mediaFileUrl] === 0) {
            delete App.pendingResources[this.mediaFileUrl];
        }
    }
    commit(gl: WebGL2RenderingContext, uniformLocation: any, textureUnit: number) {
        gl.uniform1i(uniformLocation, textureUnit);
        gl.activeTexture(gl.TEXTURE0 + textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
    }
}



