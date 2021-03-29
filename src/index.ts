// TODO: 4D Rotations

import * as THREE from "three";

class Vertex {
    pos: Array<number>; // NOTE: If you add more, make Lerp be able to process
    col: Array<number>; // RGBA
    constructor(x?: number, y?: number, z?: number, w?: number, r?: number, g?: number, b?: number) {
        this.pos = [x||0, y||0, z||0, w||0];
        this.col = [r||0, g||0, b||0];
    };
};

function Lerp(a: number, b: number, t: number): number;
function Lerp(a: Array<number>, b: Array<number>, t: number): Array<number>;
function Lerp(a: Vertex, b: Vertex, t: number): Vertex;

function Lerp(a: any, b: any, t: number): any {
    if(typeof(a) == "number")
        return a*(1-t) + b*t;
    if(a instanceof Array)
        return a.map((v: number, i: number) => Lerp(v, b[i], t));
    if(a instanceof Vertex) {
        var res: Vertex = new Vertex();
        res.pos = Lerp(a.pos, b.pos, t);
        res.col = Lerp(a.col, b.col, t);

        return res;
    }
}

function rotatePoint(point: Array<number>, theta: number, a: number, b: number): void {
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    const c = point[a];
    const d = point[b];

    point[a] = c * cosTheta - d * sinTheta;
    point[b] = d * cosTheta + c * sinTheta;
}

class Object4d {
    verts: Array<Vertex>;
    tets: Array<number[]>;

    geometry: THREE.BufferGeometry;
    material: THREE.MeshBasicMaterial;
    mesh: THREE.Mesh;

    rotation: Array<number>;

    constructor() {
        this.verts = [];
        this.tets = [];

        this.rotation = [0, 0, 0, 0, 0, 0];

        this.geometry = new THREE.BufferGeometry();
        this.material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, vertexColors: true});
        this.mesh = new THREE.Mesh(this.geometry, this.material);
    };

    _cross(w_level: number) {
        this.rotation[3] += 0.0002;
        this.rotation[4] += 0.002;
        this.rotation[5] += 0.01;
        // let render_verts: Array<Vertex> = [];
        let render_verts: Array<Array<number>> = [];

        var verts: Array<Array<number>> = [];
        this.verts.forEach((v: Vertex) => {
            let pos: Array<number> = [...(v.pos)];
            // XY, YZ, XZ, XW, YW, ZW
            rotatePoint(pos, this.rotation[3], 0, 3); // XW
            rotatePoint(pos, this.rotation[4], 1, 3); // YW
            rotatePoint(pos, this.rotation[5], 2, 3); // ZW
            verts.push([...pos, ...v.col]);
        });

        const edges: number[] = [0, 1, 0, 2, 0, 3, 1, 2, 2, 3, 1, 3];
        this.tets.forEach((t: number[]) => {
            // let pts: Array<Vertex> = [];
            let pts: Array<Array<number>> = [];
            for(let i: number = 0; i < 12; i += 2) {
                const A: Array<number> = verts[ t[ edges[  i  ] ] ];
                const B: Array<number> = verts[ t[ edges[ i+1 ] ] ];
                // const A: Vertex = this.verts[ t[ edges[  i  ] ] ];
                // const B: Vertex = this.verts[ t[ edges[ i+1 ] ] ];

                const A_w: number = A[3];
                const B_w: number = B[3];
                // const A_w: number = A.pos[3]; // Faster?
                // const B_w: number = B.pos[3];

                if(A_w == B_w) continue; // Parallel
                if(w_level < Math.min(A_w, B_w)) continue; // Below
                if(w_level > Math.max(A_w, B_w)) continue; // Above

                const n: number = 1 / (B_w - A_w); // Don't know why I can't combine this and the next statement;
                const inter: number = n * (w_level - A_w);

                pts.push( Lerp(A, B, inter) );
            }

            switch(pts.length) {
                case 0: break;
                case 3:
                    render_verts.push(...pts);
                    break;
                case 4:
                    const locations: Array<number> = [0,1,2, 1,2,3, 2,3,0, 3,0,1]; // This is technically 4 triangles, but 2 triangles doesn't work
                                                                                   // and I suspect that this is a tetrahedron, which doesn't make sense
                    locations.forEach((v: number) => render_verts.push(pts[v]));
                    break;
                default:
                    // If this happens, you shouldn't need to handle the error gracefully
                    // You should instead be preparing for the rise of Cthulhu
                    // This should never happen
                    console.log("RUN");
                    break;
            };
        });

        // By now, we should have an array of verticies where every three is a triangle
        let positions: Array<number> = [];
        let colors: Array<number> = [];

        /*
        render_verts.forEach((vert: Vertex) => {
            positions.push(...( vert.pos.slice(0,3) ));
            colors.push(...vert.col);
        });
        */
       render_verts.forEach((vert: Array<number>) => {
           positions.push(...(vert.slice(0,3)));
           colors.push(...(vert.slice(4,7)));
       });

        const positionBuffer: Float32Array = new Float32Array(positions);
        const colorBuffer: Float32Array = new Float32Array(colors);

        this.geometry.setAttribute("position", new THREE.BufferAttribute(positionBuffer, 3));
        this.geometry.setAttribute("color", new THREE.BufferAttribute(colorBuffer, 3));
    };
};

class Tesseract extends Object4d {
    constructor() {
        super();

        const COLOR = {
            RED: [1,0,0], // 255, 0, 0
            ORANGE: [1, 0.6, 0], // 255,165,0
            YELLOW: [1, 1, 0], // 255, 255, 0
            L_GREEN: [0.5, 1, 0.5], // 128,255,128
            GREEN: [0, 0.75, 0], // 0, 255, 0
            L_BLUE: [0.5, 0.5, 1], // 128, 128, 255
            BLUE: [0, 0, 0.9], // 0, 0, 255
            PURPLE: [1, 0, 1] // 255, 0, 255
        };

        const REF = [
            [COLOR.L_GREEN, COLOR.ORANGE],
            [COLOR.RED, COLOR.L_BLUE],
            [COLOR.YELLOW, COLOR.GREEN],
            [COLOR.BLUE, COLOR.PURPLE]
        ];

        function const_rect_prism(tets: Array<Array<number>>, vts: Array<number>): void {
            if(vts.length != 8) return;
            const indicies: Array<Array<number>> = [[0,1,3,4],[1,2,3,6],[1,3,4,6],[1,4,5,6],[3,4,6,7]];
            for(let i: number = 0; i < 5; i++) {
                let bld: number[] = [0,0,0,0];
                for(let j: number = 0; j < 4; j++) {
                    bld[j] = vts[indicies[i][j]];
                }
                tets.push(bld);
            }
        }

        // Build Verts
        for(let i: number = 0; i < 16; i++) {
            const x: number = ((i+1)%4<2) ? 1 : -1;
            const y: number = (i%4<2) ? 1 : -1;
            const z: number = (i%8<4) ? 1 : -1;
            const w: number = (i%16<8) ? 1 : -1;

            for(let j: number = 0; j < 4; j++) {
                // const color = ([x,y,z,w][j] == 1) ? REF[j][0] : REF[j][1];
                const color: Array<number> = REF[j][ ([x,y,z,w][j] == 1) ? 0 : 1 ];

                this.verts.push(new Vertex(x, y, z, w, ...color));
            }
        }

        // Build Tets
        const_rect_prism(this.tets, [ 3, 7,11,15,19,23,27,31]); // Inner
        const_rect_prism(this.tets, [35,39,43,47,51,55,59,63]); // Outer

        const_rect_prism(this.tets, [ 2, 6,10,14,34,38,42,46]); // Front
        const_rect_prism(this.tets, [18,22,26,30,50,54,58,62]); // Back
        const_rect_prism(this.tets, [32, 0,12,44,48,16,28,60]); // Right
        const_rect_prism(this.tets, [ 4,36,40, 8,20,52,56,24]); // Left
        const_rect_prism(this.tets, [33,37, 5, 1,49,53,21,17]); // Top
        const_rect_prism(this.tets, [13, 9,41,45,29,25,57,61]); // Bottom
    }
};

class App {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;

    obj: Object4d;

    w_level: number;

    constructor() {
        this.render = this.render.bind(this);
        this.resize = this.resize.bind(this);

        window.addEventListener("resize", this.resize);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.camera.position.z = 5;

        this.obj = new Tesseract();

        this.scene.add(this.obj.mesh);

        this.render();
    };

    resize() {
        const canvas: HTMLCanvasElement = this.renderer.domElement;
        if(canvas.width != window.innerWidth || canvas.height != window.innerHeight) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }
    };

    render() {
        this.w_level = Math.sin((new Date()).getTime()/1000)*1.1;
        this.obj._cross(0);
        this.obj.mesh.rotation.y += 0.01;
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render);
    };
};

window.addEventListener("load", () => new App());