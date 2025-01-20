class Square {
    constructor(x = 0.0, y = 0.0, size = 0.1, color = [1, 1, 1, 1]) {
      this.type   = 'square';
      this.x      = x;
      this.y      = y;
      this.size   = size;     
      this.color  = color;    
    }
  
    render() {
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
  
      let half = this.size / 2.0;
  
      let x1 = this.x - half;
      let x2 = this.x + half;
      let y1 = this.y + half;
      let y2 = this.y - half;
  
      const vertices = new Float32Array([
        x1, y1,  // top-left
        x2, y1,  // top-right
        x1, y2,  // bottom-left
        x2, y2   // bottom-right
      ]);
  
      // Create a buffer and bind
      const vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  
      // Link buffer data to a_Position
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
  }
  