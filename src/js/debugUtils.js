function printMatrix(matrix) {
    console.log(`${matrix[0]}, ${matrix[4]}, ${matrix[8]}, ${matrix[12]}`);
    console.log(`${matrix[0 + 1]}, ${matrix[4 + 1]}, ${matrix[8 + 1]}, ${matrix[12 + 1]}`);
    console.log(`${matrix[0 + 2]}, ${matrix[4 + 2]}, ${matrix[8 + 2]}, ${matrix[12 + 2]}`);
    console.log(`${matrix[0 + 3]}, ${matrix[4 + 3]}, ${matrix[8 + 3]}, ${matrix[12 + 3]}`);
}

function printTexture(texture) {

    const width = texture.width;
    const height = texture.height;

    // Create a framebuffer backed by the texture
    let framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    // Read the contents of the framebuffer
    let data = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);

    gl.deleteFramebuffer(framebuffer);

    // Create a 2D canvas to store the result
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    let context = canvas.getContext('2d');

    // Copy the pixels to a 2D canvas
    let imageData = context.createImageData(width, height);
    imageData.data.set(data);
    context.putImageData(imageData, 0, 0);

    let img = new Image();
    img.src = canvas.toDataURL();

    document.write("<img src='"+img.src+"' alt='from canvas'/>");

    return img;
}