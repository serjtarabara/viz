'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

let point;
let texturePoint;
let scalingKoef;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices, textures) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textures), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }
    this.PointBufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexture, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexture);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
    this.DrawPoint = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.drawArrays(gl.LINE_STRIP, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    this.iAttribTexture = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;
    this.iTranslatePoint = -1;
    this.iTexturePoint = -1;
    this.iScalingKoef = -1;
    this.iTMU = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}

/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI / 8, 1, 8, 12);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.uniform1i(shProgram.iTMU, 0);
    gl.enable(gl.TEXTURE_2D);
    gl.uniform2fv(shProgram.iTexturePoint, [texturePoint.x, texturePoint.y]);
    gl.uniform1f(shProgram.iScalingKoef, scalingKoef);
    surface.Draw();
    const t = TwoCoaxialCylinders(map(texturePoint.x,0,1,0,2*bb),map(texturePoint.y,0,1,0,2*Math.PI))
    gl.uniform3fv(shProgram.iTranslatePoint, [t.x, t.y, t.z]);
    gl.uniform1f(shProgram.iScalingKoef, -scalingKoef);
    point.DrawPoint();
}

const bb = 1;
function CreateSurfaceData() {
    let vertexList = [];

    for (let i = 0; i < 2 * bb; i += 0.1) {
        for (let j = 0; j < 360; j += 1) {
            let v1 = TwoCoaxialCylinders(i, deg2rad(j))
            let v2 = TwoCoaxialCylinders(i + 0.1, deg2rad(j))
            let v3 = TwoCoaxialCylinders(i, deg2rad(j + 1))
            let v4 = TwoCoaxialCylinders(i + 0.1, deg2rad(j + 1))
            vertexList.push(v1.x, v1.y, v1.z)
            vertexList.push(v2.x, v2.y, v2.z)
            vertexList.push(v3.x, v3.y, v3.z)
            vertexList.push(v3.x, v3.y, v3.z)
            vertexList.push(v4.x, v4.y, v4.z)
            vertexList.push(v2.x, v2.y, v2.z)
        }
    }
    return vertexList;
}
function LoadTextureBuffer() {
    let textureList = [];
    for (let i = 0; i < 2 * bb; i += 0.1) {
        for (let j = 0; j < 360; j += 1) {
            let u = map(i, 0, 2*bb, 0, 1);
            let v = map(j, 0, 360, 0, 1);
            textureList.push(u, v)
            u = map(i +0.1, 0, 2*bb, 0, 1)
            textureList.push(u, v)
            u = map(i, 0, 2*bb, 0, 1)
            v = map(j + 1, 0, 360, 0, 1)
            textureList.push(u, v)
            textureList.push(u, v)
            u = map(i + 0.1, 0, 2*bb, 0, 1)
            textureList.push(u, v)
            v = map(j, 0, 360, 0, 1);
            textureList.push(u, v)
        }
    }
    return textureList;
}

function CreateSphereSurface(r = 0.05) {
    let vertexList = [];
    let lon = -Math.PI;
    let lat = -Math.PI * 0.5;
    while (lon < Math.PI) {
        while (lat < Math.PI * 0.5) {
            let v1 = sphereSurfaceDate(r, lon, lat);
            vertexList.push(v1.x, v1.y, v1.z);
            lat += 0.05;
        }
        lat = -Math.PI * 0.5
        lon += 0.05;
    }
    return vertexList;
}

function sphereSurfaceDate(r, u, v) {
    let x = r * Math.sin(u) * Math.cos(v);
    let y = r * Math.sin(u) * Math.sin(v);
    let z = r * Math.cos(u);
    return { x: x, y: y, z: z };
}

function vec3Cross(a, b) {
    let x = a.y * b.z - b.y * a.z;
    let y = a.z * b.x - b.z * a.x;
    let z = a.x * b.y - b.x * a.y;
    return { x: x, y: y, z: z }
}

function vec3Normalize(a) {
    var mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    a.x /= mag; a.y /= mag; a.z /= mag;
}

const multiplier = 1.0;
function TwoCoaxialCylinders(a, b) {
    const X = r(a) * Math.cos(b)
    const Y = r(a) * Math.sin(b)
    const Z = a
    return { x: X * multiplier, y: Y * multiplier, z: Z * multiplier }
}

const R1 = 1;
const R2 = 2;
function r(a) {
    return ((R2 - R1) * 0.5 * (1 - Math.cos(Math.PI * a / (2 * bb)) + R1))
}

/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribTexture = gl.getAttribLocation(prog, "texture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iTranslatePoint = gl.getUniformLocation(prog, 'translatePoint');
    shProgram.iTexturePoint = gl.getUniformLocation(prog, 'texturePoint');
    shProgram.iScalingKoef = gl.getUniformLocation(prog, 'scalingKoef');
    shProgram.iTMU = gl.getUniformLocation(prog, 'tmu');

    LoadTexture()
    surface = new Model('Surface');
    // console.log(CreateSurfaceData().length)
    surface.BufferData(CreateSurfaceData(), LoadTextureBuffer());
    point = new Model('Point');
    point.PointBufferData(CreateSphereSurface())


    gl.enable(gl.DEPTH_TEST);
}

function map(val, f1, t1, f2, t2) {
    let m;
    m = (val - f1) * (t2 - f2) / (t1 - f1) + f2
    return Math.min(Math.max(m, f2), t2);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    texturePoint = { x: 0.33, y: 0.33 }
    scalingKoef = 1.0;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    draw();
}

function LoadTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const image = new Image();
    image.crossOrigin = 'anonymus';

    image.src = "https://raw.githubusercontent.com/serjtarabara/viz/CGW/cornell_box_04.jpeg";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        draw()
    }
}
window.onkeydown = (e) => {
    switch (e.keyCode) {
        case 87:
            texturePoint.x -= 0.02;
            break;
        case 83:
            texturePoint.x += 0.02;
            break;
        case 65:
            texturePoint.y += 0.02;
            break;
        case 68:
            texturePoint.y -= 0.02;
            break;
    }
    texturePoint.x = Math.max(0.001, Math.min(texturePoint.x, 0.999))
    texturePoint.y = Math.max(0.001, Math.min(texturePoint.y, 0.999))
    draw();
}

onmousemove = (e) => {
    scalingKoef = map(e.clientX, 0, window.outerWidth, 0, Math.PI)
    draw()
};