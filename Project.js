var gl;
var points = [];
var normals = [];
var texCoords = [];

var program0, program1, program2;     // [program1] Phong shading, [program2] Texture Mapping
var modelViewMatrixLoc0, modelViewMatrixLoc1, modelViewMatrixLoc2; // program과 loc을 맞춰야한다. program0은 Loc0을 써야한다.

var eye = vec3(-3.5, 2, 6); //vec3(-3.5, 3, 5)
var at = vec3(0, 0, 0);
const up = vec3(0, 1, 0);
var cameraVec = vec3(0, -0.7071, -0.7071); // 1.0/Math.sqrt(2.0)

var theta = 0;
var trballMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
var vertCubeStart, vertCubeEnd, vertHexaStart, vertHexaEnd, vertGroundStart, vertGroundEnd;

var dir = 0;
var moveup = 0, movedir = 0;

var goal = 0;

window.onload = function init()
{
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if( !gl ) {
        alert("WebGL isn't available!");
    }

    generateTexCube();
    generateHexaPyramid();
    generateTexGround(5);

    // virtual trackball
    /*
    var trball = trackball(canvas.width, canvas.height);
    var mouseDown = false;

    canvas.addEventListener("mousedown", function (event) {
        trball.start(event.clientX, event.clientY);

        mouseDown = true;
    });

    canvas.addEventListener("mouseup", function (event) {
        mouseDown = false;
    });

    canvas.addEventListener("mousemove", function (event) {
        if (mouseDown) {
            trball.end(event.clientX, event.clientY);

            trballMatrix = mat4(trball.rotationMatrix);
        }
    });*/

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.9, 0.9, 0.9, 1.0);

    // Enable hidden-surface removal
    gl.enable(gl.DEPTH_TEST);

    // Load shaders and initialize attribute buffers
    program0 = initShaders(gl, "colorVS", "colorFS");
    gl.useProgram(program0);

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program0, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var viewMatrix = lookAt(eye, at, up);
    modelViewMatrixLoc0 = gl.getUniformLocation(program0, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrixLoc0, false, flatten(viewMatrix));
    
    // 3D perspective viewing
    var aspect = canvas.width / canvas.height;
    projectionMatrix = perspective(90, aspect, 0.1, 1000); 
    var projectionMatrixLoc = gl.getUniformLocation(program0, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    ///////////////////////////////////////////////////////////////////////////
    // program1 : Phong Shading

    program1 = initShaders(gl, "phongVS", "phongFS");
    gl.useProgram(program1);

    // Load the data into the GPU
    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer
    vPosition = gl.getAttribLocation(program1, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Create a buffer object, initialize it, and associate it with 
    // the associated attribute variable in our vertex shader
    var nBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program1, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    modelViewMatrixLoc1 = gl.getUniformLocation(program1, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrixLoc1, false, flatten(viewMatrix));
    
    // 3D perspective viewing
    projectionMatrixLoc = gl.getUniformLocation(program1, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    setLighting(program1);

    ///////////////////////////////////////////////////////////////////////////
    // program2 : Texture Mapping

    program2 = initShaders(gl, "texMapVS", "texMapFS");
    gl.useProgram(program2);

    // Load the data into the GPU
    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer
    vPosition = gl.getAttribLocation(program2, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Create a buffer object, initialize it, and associate it with 
    // the associated attribute variable in our vertex shader
    nBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    vNormal = gl.getAttribLocation(program2, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var tBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program2, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    modelViewMatrixLoc2 = gl.getUniformLocation(program2, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(viewMatrix));

    // 3D perspective viewing
    projectionMatrixLoc = gl.getUniformLocation(program2, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    setLighting(program2);
    setTexture();

    // Event listeners for buttons
    var sinTheta = Math.sin(Math.PI/2);
    var cosTheta = Math.cos(Math.PI/2);
    document.getElementById("left").onclick = function () {
        dir--;
        var newVecX = cosTheta*cameraVec[0] + sinTheta*cameraVec[2];
        var newVecZ = -sinTheta*cameraVec[0] + cosTheta*cameraVec[2];
        cameraVec[0] = newVecX;
        cameraVec[2] = newVecZ;

        if(dir == 0){
            eye[0] += 1.42;
            eye[2] += 1.42;
        }
        if(dir == -1){
            eye[0] += 1.42;
            eye[2] += -1.42;
        }
        if(dir == -2){
            eye[0] += -1.42;
            eye[2] += -1.42;
        }
        if(dir == -3){
            eye[0] += -1.42;
            eye[2] += 1.42;
        }
        if(dir == -4){
            eye[0] += 1.42;
            eye[2] += 1.42;
        }

        if(dir == 1){
            eye[0] += -1.42;
            eye[2] += 1.42;
        }
        if(dir == 2){
            eye[0] += -1.42;
            eye[2] += -1.42;
        }
        if(dir == -4) dir = 0;
    };
    document.getElementById("right").onclick = function () {
        dir++;
        var newVecX = cosTheta*cameraVec[0] - sinTheta*cameraVec[2];
        var newVecZ = sinTheta*cameraVec[0] + cosTheta*cameraVec[2];
        cameraVec[0] = newVecX;
        cameraVec[2] = newVecZ;

        if(dir == 0){
            eye[0] += -1.42;
            eye[2] += 1.42;
        }
        if(dir == 1){
            eye[0] += -1.42;
            eye[2] += -1.42;
        }
        if(dir == 2){
            eye[0] += 1.42;
            eye[2] += -1.42;
        }
        if(dir == 3){
            eye[0] += 1.42;
            eye[2] += 1.42;
        }
        if(dir == 4){
            eye[0] += -1.42;
            eye[2] += 1.42;
        }

        if(dir == -1){
            eye[0] += 1.42;
            eye[2] += 1.42;
        }
        if(dir == -2){
            eye[0] += 1.42;
            eye[2] += -1.42;
        }
        if(dir == 4) dir = 0;
    };
    document.getElementById("up").onclick = function () {
        var newPosX = eye[0] + 1.42 * cameraVec[0];
        var newPosZ = eye[2] + 1.42 * cameraVec[2];
        if (newPosX > -10 && newPosX < 10 && newPosZ > -10 && newPosZ < 10) { 
            eye[0] = newPosX;
            eye[2] = newPosZ;
            if(goal == 0 && eye[0] > 0.4 && eye[0] < 0.6 && eye[2] < -1.9 && eye[2] > -2.1) { goal = 1;} //첫번째 지점 도착
            if(goal == 1 && eye[0] > 0.4 && eye[0] < 0.6 && eye[2] < 3.1 && eye[2] > 2.9) { goal = 2;} //두번째 지점 도착
            if(goal == 2 && eye[0] > 3.4 && eye[0] < 3.6 && eye[2] < -2.9 && eye[2] > -3.1) { goal = 3;} //마지막 지점 도착

            if(dir == 0) {moveup++;}
            if(dir == 1 || dir == -3) {movedir++;}
            if(dir == 2 || dir == -2) {moveup--;}
            if(dir == 3 || dir == -1) {movedir--;}
            if(dir == 4 || dir == -4) {moveup++;}
        }
    };
    document.getElementById("down").onclick = function () {
        var newPosX = eye[0] - 1.42 * cameraVec[0];
        var newPosZ = eye[2] - 1.42 * cameraVec[2];
        if (newPosX > -10 && newPosX < 10 && newPosZ > -10 && newPosZ < 10) { 
            eye[0] = newPosX;
            eye[2] = newPosZ;
        
            if(dir == 0) {moveup--;}
            else if(dir == 1 || dir == -3) {movedir--;}
            else if(dir == 2 || dir == -2) {moveup++;}
            else if(dir == 3 || dir == -1) {movedir++;}
            else if(dir == 4 || dir == -4) {moveup--;}
        }
    };
    document.getElementById("space").onclick = function () {
        goal = 0;
        eye[0] = -3.5;
        eye[2] = 6;
        movedir = 0;
        moveup = 0;

        ch.innerHTML = "";
    }

    render();
};

function setLighting(program) {
    var lightPos = [0.0, 1.0, 0.0, 0.0];
    var lightAmbient = [0.0, 0.0, 0.0, 1.0];
    var lightDiffuse = [1.0, 1.0, 1.0, 1.0];
    var lightSpecular = [1.0, 1.0, 1.0, 1.0];

    var matAmbient = [1.0, 1.0, 1.0, 1.0];
    var matDiffuse = [1.0, 1.0, 1.0, 1.0];
    var matSpecular = [1.0, 1.0, 1.0, 1.0];
    
    var ambientProduct = mult(lightAmbient, matAmbient);
    var diffuseProduct = mult(lightDiffuse, matDiffuse);
    var specularProduct = mult(lightSpecular, matSpecular);

    var lightPosLoc = gl.getUniformLocation(program, "lightPos");
    gl.uniform4fv(lightPosLoc, lightPos);
    var ambientProductLoc = gl.getUniformLocation(program, "ambientProduct")
    gl.uniform4fv(ambientProductLoc, ambientProduct);
    var diffuseProductLoc = gl.getUniformLocation(program, "diffuseProduct");
    gl.uniform4fv(diffuseProductLoc, diffuseProduct);
    var specularProductLoc = gl.getUniformLocation(program, "specularProduct");
    gl.uniform4fv(specularProductLoc, specularProduct);
    
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), 100.0);
}

function setTexture() {
    var image = new Image();
    image.src = "images/logo.bmp";
    
    var texture0 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    
    var image1 = new Image();
    image1.src = "images/crate.bmp"
    
    var texture1 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image1);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_LINEAR);
}

function cleartext(){
    ch.innerHTML = "** CLEAR **";
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    theta += 2.0;

    at[0] = eye[0] + cameraVec[0];
    at[1] = eye[1] + cameraVec[1];
    at[2] = eye[2] + cameraVec[2];
    var viewMatrix = lookAt(eye, at, up);

    var colorLoc = gl.getUniformLocation(program0, "uColor");
    var diffuseProductLoc = gl.getUniformLocation(program1, "diffuseProduct");
    
    // draw the ground
    gl.useProgram(program2);
    gl.uniform1i(gl.getUniformLocation(program2, "texture"), 0);

    modelViewMatrix = mult(viewMatrix, trballMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.TRIANGLES, vertGroundStart, vertGroundEnd);

    for (var z=-4.5; z<5.5; z+=1) { // draw a cube 외벽
        gl.useProgram(program2);
        gl.uniform1i(gl.getUniformLocation(program2, "texture"), 1);

        var rMatrix = mult(rotateY(0), rotateZ(0));
        var modelMatrix = mult(translate(-4.5, -0.4, z), rMatrix);
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, vertCubeEnd);

        modelMatrix = mult(translate(4.5, -0.4, z), rMatrix);
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, vertCubeEnd);
    }
    for (var z=-4.5; z<3.5; z+=1) { // draw a cube 미로 외벽
        modelMatrix = mult(translate(z, -0.4, -4.5), rMatrix);
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, vertCubeEnd);

        modelMatrix = mult(translate(-z, -0.4, 4.5), rMatrix);
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, vertCubeEnd);
    }
    for (var z=0.5; z<4.5; z+=1) { // draw a cube 미로 내벽
        var rMatrix = mult(rotateY(0), rotateZ(0));
        var modelMatrix = mult(translate(-2.5, -0.4, z), rMatrix);
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, vertCubeEnd);

        modelMatrix = mult(translate(z-1, -0.4, 0.5), rMatrix);
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, vertCubeEnd);
    }
    for (var z=-2.5; z<-0.5; z+=1) { // draw a cube 미로 내벽
        var rMatrix = mult(rotateY(0), rotateZ(0));
        var modelMatrix = mult(translate(-2.5, -0.4, z), rMatrix);
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, vertCubeEnd);

        modelMatrix = mult(translate(z, -0.4, -2.5), rMatrix);
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, vertCubeEnd);

        modelMatrix = mult(translate(-0.5, -0.4, z-1), rMatrix);
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, vertCubeEnd);

        modelMatrix = mult(translate(-0.5, -0.4, z+2), rMatrix);
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, vertCubeEnd);

        modelMatrix = mult(translate(-0.5, -0.4, z+4), rMatrix);
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, vertCubeEnd);

        modelMatrix = mult(translate(1.5, -0.4, z+4), rMatrix);
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, vertCubeEnd);

        modelMatrix = mult(translate(z+4, -0.4, 2.5), rMatrix);
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, vertCubeEnd);

        modelMatrix = mult(translate(z+6, -0.4, -2.5), rMatrix);
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, vertCubeEnd);

        modelMatrix = mult(translate(2.5, -0.4, z+2), rMatrix);
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, vertCubeEnd);

        modelMatrix = mult(translate(1.5, -0.4, z), rMatrix);
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, vertCubeEnd);
        modelMatrix = mult(translate(1.5, -0.4, -3.5), rMatrix);
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, vertCubeEnd);

    }
    // draw a hexa-pyramid
    if(goal == 0){ // 첫번째 지점 도착
        // draw a hexa-pyramid - Goal Point1
        gl.useProgram(program0);
        gl.uniform4f(colorLoc, 1.0, 1.0, 0.0, 0.5);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        modelMatrix = mult(translate(0.5, -0.4, -3.5), rotateZ(180));
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc0, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertHexaStart, vertHexaEnd);

        gl.disable(gl.BLEND);
    }
    else if(goal == 1){ // 첫번째 지점 도착
        // draw a hexa-pyramid - Goal Point1
        gl.useProgram(program1);
        gl.uniform4f(diffuseProductLoc, 1.0, 1.0, 0.0, 1.0);

        modelMatrix = mult(translate(0.5, -0.4, -3.5), rotateZ(180));
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc1, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertHexaStart, vertHexaEnd);

        // draw a hexa-pyramid - Goal Point2
        gl.useProgram(program0);
        gl.uniform4f(colorLoc, 0.0, 1.0, 1.0, 0.5);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        modelMatrix = mult(translate(0.5, -0.4, 1.5), rotateZ(180));
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc0, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertHexaStart, vertHexaEnd);

        gl.disable(gl.BLEND);
    }
    else if(goal == 2){ // 두번째 지점 도착
        // draw a hexa-pyramid - Goal Point1
        gl.useProgram(program1);
        gl.uniform4f(diffuseProductLoc, 1.0, 1.0, 0.0, 1.0);

        modelMatrix = mult(translate(0.5, -0.4, -3.5), rotateZ(180));
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc1, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertHexaStart, vertHexaEnd);

        // draw a hexa-pyramid - Goal Point2
        gl.useProgram(program1);
        gl.uniform4f(diffuseProductLoc, 0.0, 1.0, 1.0, 1.0);

        modelMatrix = mult(translate(0.5, -0.4, 1.5), rotateZ(180));
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc1, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertHexaStart, vertHexaEnd);

        // draw a hexa-pyramid - Goal Point3
        gl.useProgram(program0);
        gl.uniform4f(colorLoc, 1.0, 0.0, 0.0, 0.5);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        modelMatrix = mult(translate(3.5, -0.4, -4.5), rotateZ(180));
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc0, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertHexaStart, vertHexaEnd);

        gl.disable(gl.BLEND);
    }
    else if(goal == 3){ // 마지막 세번째 지점 도착
        // draw a hexa-pyramid - Goal Point1
        gl.useProgram(program1);
        gl.uniform4f(diffuseProductLoc, 1.0, 1.0, 0.0, 1.0);

        modelMatrix = mult(translate(0.5, -0.4, -3.5), rotateZ(180));
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc1, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertHexaStart, vertHexaEnd);

        // draw a hexa-pyramid - Goal Point2
        gl.useProgram(program1);
        gl.uniform4f(diffuseProductLoc, 0.0, 1.0, 1.0, 1.0);

        modelMatrix = mult(translate(0.5, -0.4, 1.5), rotateZ(180));
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc1, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertHexaStart, vertHexaEnd);

        // draw a hexa-pyramid - Goal Point3
        gl.useProgram(program1);
        gl.uniform4f(diffuseProductLoc, 1.0, 0.0, 0.0, 1.0);

        modelMatrix = mult(translate(3.5, -0.4, -4.5), rotateZ(180));
        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc1, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, vertHexaStart, vertHexaEnd);

        eye[0] = 0;
        eye[2] = 6;
        
        //클리어 텍스트 출력
        cleartext();
    }

    //draw the hexa-pyramid - player
    gl.useProgram(program1);
    gl.uniform4f(diffuseProductLoc, 0.0, 0.0, 1.0, 1.0); // blue

    modelMatrix = mult(translate(-3.5+movedir, -0.4, 4.5-moveup), rotateX(180));
    modelMatrix = mult(trballMatrix, modelMatrix);
    modelViewMatrix = mult(viewMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc1, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.TRIANGLES, vertHexaStart, vertHexaEnd);

    requestAnimationFrame(render);
}

function generateTexCube() {
    vertCubeStart = points.length;
    vertCubeEnd = 0;
    texQuad(1, 0, 3, 2);
    texQuad(2, 3, 7, 6);
    texQuad(3, 0, 4, 7);
    texQuad(4, 5, 6, 7);
    texQuad(5, 4, 0, 1);
    texQuad(6, 5, 1, 2);
}

function texQuad(a, b, c, d) {
    const vertexPos = [
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4( 0.5, -0.5, -0.5, 1.0),
        vec4( 0.5,  0.5, -0.5, 1.0),
        vec4(-0.5,  0.5, -0.5, 1.0),
        vec4(-0.5, -0.5,  0.5, 1.0),
        vec4( 0.5, -0.5,  0.5, 1.0),
        vec4( 0.5,  0.5,  0.5, 1.0),
        vec4(-0.5,  0.5,  0.5, 1.0)
    ];

    const vertexNormals = [
        vec4(-0.57735, -0.57735, -0.57735, 0.0),
        vec4( 0.57735, -0.57735, -0.57735, 0.0),
        vec4( 0.57735,  0.57735, -0.57735, 0.0),
        vec4(-0.57735,  0.57735, -0.57735, 0.0),
        vec4(-0.57735, -0.57735,  0.57735, 0.0),
        vec4( 0.57735, -0.57735,  0.57735, 0.0),
        vec4( 0.57735,  0.57735,  0.57735, 0.0),
        vec4(-0.57735,  0.57735,  0.57735, 0.0)
    ];

    const texCoord = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];

    // two triangles: (a, b, c) and (a, c, d)
    // solid colored faces
    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    vertCubeEnd++;

    points.push(vertexPos[b]);
    normals.push(vertexNormals[b]);
    texCoords.push(texCoord[1]);
    vertCubeEnd++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    vertCubeEnd++;

    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    vertCubeEnd++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    vertCubeEnd++;

    points.push(vertexPos[d]);
    normals.push(vertexNormals[d]);
    texCoords.push(texCoord[3]);
    vertCubeEnd++;
}

function generateTexGround(scale) {
    vertGroundStart = points.length;
    vertGroundEnd = 0;
    for(var x=-scale; x<scale; x++) {
        for(var z=-scale; z<scale; z++) {
            // two triangles
            points.push(vec4(x, -1.0, z, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(0, 0));
            vertGroundEnd++;
            
            points.push(vec4(x, -1.0, z+1, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(0, 1));
            vertGroundEnd++;

            points.push(vec4(x+1, -1.0, z+1, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(1, 1)); 
            vertGroundEnd++;

            points.push(vec4(x, -1.0, z, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(0, 0));
            vertGroundEnd++;

            points.push(vec4(x+1, -1.0, z+1, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(1, 1));
            vertGroundEnd++;

            points.push(vec4(x+1, -1.0, z, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(1, 0));
            vertGroundEnd++;
        }
    }
}

function generateHexaPyramid() {
    const vertexPos = [
        vec4( 0.0,  0.25,   0.0, 1.0),
        vec4( 0.5,  0.25,   0.0, 1.0),
        vec4( 0.25, 0.25,-0.433, 1.0),
        vec4(-0.25, 0.25,-0.433, 1.0),
        vec4(-0.5,  0.25,   0.0, 1.0),
        vec4(-0.25, 0.25, 0.433, 1.0),
        vec4( 0.25, 0.25, 0.433, 1.0),
        vec4( 0.0,  -0.5,   0.0, 1.0)
    ];

    const vertexNormal = [
        vec4( 0.0,  0.25,   0.0, 0.0),
        vec4( 0.5,  0.25,   0.0, 0.0),
        vec4( 0.25, 0.25,-0.433, 0.0),
        vec4(-0.25, 0.25,-0.433, 0.0),
        vec4(-0.5,  0.25,   0.0, 0.0),
        vec4(-0.25, 0.25, 0.433, 0.0),
        vec4( 0.25, 0.25, 0.433, 0.0),
        vec4( 0.0,  -0.5,   0.0, 0.0)
    ];

    vertHexaStart = points.length;
    vertHexaEnd = 0;
    for (var i=1; i<6; i++) {
        points.push(vertexPos[0]);
        normals.push(vertexNormal[0]);
        vertHexaEnd++;

        points.push(vertexPos[i]);
        normals.push(vertexNormal[0]);
        vertHexaEnd++;

        points.push(vertexPos[i+1]);
        normals.push(vertexNormal[0]);
        vertHexaEnd++;

        points.push(vertexPos[7]);
        normals.push(vertexNormal[7]);
        vertHexaEnd++;

        points.push(vertexPos[i+1]);
        normals.push(vertexNormal[i+1]);
        vertHexaEnd++;

        points.push(vertexPos[i]);
        normals.push(vertexNormal[i]);
        vertHexaEnd++;
    }
    points.push(vertexPos[0]);
    normals.push(vertexNormal[0]);
    vertHexaEnd++;

    points.push(vertexPos[6]);
    normals.push(vertexNormal[0]);
    vertHexaEnd++;

    points.push(vertexPos[1]);
    normals.push(vertexNormal[0]);
    vertHexaEnd++;

    points.push(vertexPos[7]);
    normals.push(vertexNormal[7]);
    vertHexaEnd++;

    points.push(vertexPos[1]);
    normals.push(vertexNormal[1]);
    vertHexaEnd++;

    points.push(vertexPos[6]);
    normals.push(vertexNormal[6]);
    vertHexaEnd++;
}
